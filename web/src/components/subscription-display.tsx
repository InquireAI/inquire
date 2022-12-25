import { TrashIcon } from "@heroicons/react/24/outline";
import { classNames } from "../utils/classnames";

type Props = {
  subscription: {
    status: string;
    currentPeriodEnd: Date;
    currentPeriodStart: Date;
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

  return (
    <div className="flex flex-row items-center justify-between">
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
                  {`Next invoice on ${subscription.currentPeriodEnd.toLocaleDateString(
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
      <button className="flex flex-row items-center justify-center gap-1 rounded-lg px-2 py-1 font-medium text-rose-700 hover:bg-rose-700 hover:text-white">
        <TrashIcon className="h-4 w-4" />
        Cancel
      </button>
    </div>
  );
};

export default SubscriptionDisplay;
