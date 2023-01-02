import { CreditCardIcon } from "@heroicons/react/24/outline";
import { PencilIcon } from "@heroicons/react/24/outline";
import { trpc } from "../utils/trpc";
import Spinner from "./spinner";

const ChangePaymentMethodButton: React.FC<{
  subscriptionId: string;
}> = ({ subscriptionId }) => {
  const { mutate: createCheckoutSession, isLoading } =
    trpc.checkoutSession.createSetupCheckoutSession.useMutation({
      onSuccess(data) {
        window.location.replace(data.url);
      },
    });

  return (
    <button
      className="flex flex-row items-center justify-center gap-1 rounded-lg px-2 py-1 font-medium text-neutral-700 hover:border-transparent hover:bg-neutral-700 hover:text-white"
      onClick={() =>
        createCheckoutSession({
          successUrl: "/account",
          cancelUrl: "/account",
          subscriptionId,
        })
      }
    >
      {!isLoading ? (
        <>
          <PencilIcon className="h-4 w-4" />
          Change
        </>
      ) : (
        <Spinner />
      )}
    </button>
  );
};

type Props = {
  subscriptionId: string;
  paymentMethod: {
    card?: {
      brand: string;
      last4: string;
      expYear: number;
      expMonth: number;
    } | null;
  };
};

const PaymentMethodDisplay: React.FC<Props> = (props) => {
  const { paymentMethod } = props;

  if (paymentMethod.card) {
    const { brand, last4, expMonth, expYear } = paymentMethod.card;

    const expDate = new Date(expYear, expMonth).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    });

    return (
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-4 font-medium">
          <CreditCardIcon
            className="rounded bg-neutral-700 p-2 text-white"
            height={50}
            width={50}
          />
          <div className="flex flex-col text-neutral-600">
            <p className="font-medium">
              {brand.toUpperCase()} ending in {last4}
            </p>
            <p className="font-light">Expires on {expDate}</p>
          </div>
        </div>
        <ChangePaymentMethodButton subscriptionId={props.subscriptionId} />
      </div>
    );
  }

  return null;
};

export default PaymentMethodDisplay;
