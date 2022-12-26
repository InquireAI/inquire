import { Dialog } from "@headlessui/react";
import { SparklesIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { classNames } from "../utils/classnames";
import { trpc } from "../utils/trpc";
import Modal, { type Props as ModalProps } from "./modal";
import Spinner from "./spinner";

const CancelSubscriptionModalContent: React.FC<{
  subscriptionId: string;
  onClose: ModalProps["onClose"];
}> = (props) => {
  const { onClose, subscriptionId } = props;

  const [isCanceled, setIsCanceled] = useState(false);

  const { mutate: cancelSubscription, isLoading: cancelSubscriptionLoading } =
    trpc.customer.cancelSubscription.useMutation({
      onSuccess() {
        setIsCanceled(true);
      },
    });

  if (isCanceled) {
    return (
      <h3 className="text-xl font-medium text-gray-600">
        Your subscription has been scheduled to be cancelled
      </h3>
    );
  }

  return (
    <>
      <Dialog.Title
        as="h3"
        className="text-lg font-medium leading-6 text-gray-900"
      >
        Are you sure you want to cancel?
      </Dialog.Title>
      <div className="mt-2">
        <p className="text-sm text-gray-500">
          If so, your subscription will still be active until the end of the
          current billing period, at which point it which be cancelled.
        </p>
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="inline-flex justify-center rounded-md border border-transparent bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
          onClick={() =>
            cancelSubscription({
              subscriptionId: subscriptionId,
            })
          }
        >
          {!cancelSubscriptionLoading ? "Yes" : <Spinner />}
        </button>
        <button
          type="button"
          className="ml-3 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
          onClick={onClose}
        >
          No
        </button>
      </div>
    </>
  );
};

const ReactivateSubscriptionModalContent: React.FC<{
  subscriptionId: string;
  onClose: ModalProps["onClose"];
}> = (props) => {
  const { onClose, subscriptionId } = props;

  const [isReactivated, setIsReactivated] = useState(false);

  const {
    mutate: reactivateSubscription,
    isLoading: reactivateSubscriptionLoading,
  } = trpc.customer.reactivateSubscription.useMutation({
    onSuccess() {
      setIsReactivated(true);
    },
  });

  if (isReactivated) {
    return (
      <h3 className="text-xl font-medium text-gray-600">
        Your subscription has been reactivated!
      </h3>
    );
  }

  return (
    <>
      <Dialog.Title
        as="h3"
        className="text-lg font-medium leading-6 text-gray-900"
      >
        Are you sure you want to reactivate your subscription?
      </Dialog.Title>
      <div className="mt-2">
        <p className="text-sm text-gray-500">
          If so, your subscription will continue to be invoiced on the date it
          was scheduled to be cancelled
        </p>
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="inline-flex justify-center rounded-md border border-transparent bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
          onClick={() =>
            reactivateSubscription({
              subscriptionId: subscriptionId,
            })
          }
        >
          {!reactivateSubscriptionLoading ? "Yes" : <Spinner />}
        </button>
        <button
          type="button"
          className="ml-3 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
          onClick={onClose}
        >
          No
        </button>
      </div>
    </>
  );
};

type Props = {
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: Date;
    currentPeriodStart: Date;
    cancelAtPeriodEnd: boolean;
    subscriptionItems: {
      price: {
        recurring?: {
          interval: string;
        } | null;
        product: {
          name: string;
        };
        unitAmount: number;
      };
    }[];
  };
};

const SubscriptionDisplay: React.FC<Props> = (props) => {
  const { subscription } = props;
  const [show, setShow] = useState(false);

  const trpcUtils = trpc.useContext();

  return (
    <div className="flex flex-row items-center justify-between">
      <Modal
        show={show}
        onClose={() => {
          // invalidate getCustomerData to retrieve new subscription info
          /*
          TODO: move this to each individual content and provide info in
          onClose to check if the subscription was actually cancelled or reactivated
          and only invalidate if they were
           */
          trpcUtils.customer.getCustomerData.invalidate();
          setShow(false);
        }}
        renderContent={({ onClose }) => {
          return subscription.cancelAtPeriodEnd ? (
            <ReactivateSubscriptionModalContent
              onClose={onClose}
              subscriptionId={subscription.id}
            />
          ) : (
            <CancelSubscriptionModalContent
              onClose={onClose}
              subscriptionId={subscription.id}
            />
          );
        }}
      />
      <div className="flex flex-col gap-4 py-5">
        {subscription.subscriptionItems.map((si, idx) => {
          return (
            <div key={idx}>
              <div className="flex flex-row gap-3 py-2">
                <p className="font-medium">{si.price.product.name}</p>
                <p
                  className={classNames(
                    "rounded p-1 text-xs",
                    subscription.status === "active" ||
                      subscription.status === "trialing"
                      ? "bg-green-300 text-green-700"
                      : "bg-red-300 text-red-700"
                  )}
                >
                  {subscription.status}
                </p>
              </div>
              <span className="flex flex-row gap-2 font-light text-gray-700">
                <p>
                  {`$${
                    si.price.unitAmount / 100
                  } per ${si.price.recurring?.interval.toLowerCase()}`}
                </p>
                <p>&middot;</p>
                <p>
                  {`${
                    subscription.cancelAtPeriodEnd
                      ? "Will be cancelled on"
                      : "Next invoice on"
                  } ${subscription.currentPeriodEnd.toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}`}
                </p>
              </span>
            </div>
          );
        })}
      </div>
      {subscription.cancelAtPeriodEnd ? (
        <button
          onClick={() => setShow(true)}
          className="flex flex-row items-center justify-center gap-1 rounded-lg px-2 py-1 font-medium text-rose-700 hover:bg-rose-700 hover:text-white"
        >
          <SparklesIcon className="h-4 w-4" />
          Reactivate
        </button>
      ) : (
        <button
          onClick={() => setShow(true)}
          className="flex flex-row items-center justify-center gap-1 rounded-lg px-2 py-1 font-medium text-rose-700 hover:bg-rose-700 hover:text-white"
        >
          <TrashIcon className="h-4 w-4" />
          Cancel
        </button>
      )}
    </div>
  );
};

export default SubscriptionDisplay;
