import { classNames } from "../utils/classnames";
import { trpc } from "../utils/trpc";
import Spinner from "./spinner";
import Subscribe from "./subscribe";

const BillingTab: React.FC = () => {
  const { data: customer, isLoading } =
    trpc.customer.getCustomerData.useQuery();

  if (isLoading)
    return (
      <div className="flex min-h-full flex-grow items-center justify-center">
        <Spinner />
      </div>
    );

  if (!customer) {
    return <p>Couldn&apos;t find you billing information</p>;
  }

  if (!customer.subscriptions.length) {
    return (
      <div className="flex min-h-full flex-grow flex-col items-center justify-center gap-2 font-medium">
        <div className="flex w-full flex-col justify-evenly gap-5 rounded-xl border border-gray-200 bg-gray-100 p-10 md:w-1/2 lg:w-1/3">
          <div className="w-full">
            <div className="border-b border-gray-300">
              <p className="text-4xl">Premium</p>
              <p className="text-sm">Super-charge your ai assistant</p>
            </div>
          </div>
          <div>
            <p className="text-4xl">$5</p>
            <p className="text-sm text-gray-600">per month</p>
          </div>
          <Subscribe />
          <ul className="list-disc items-center px-5 text-base font-light text-gray-600">
            <li>Unlimited Inquiries</li>
            <li>Access to all inquire prompts</li>
          </ul>
        </div>
      </div>
    );
  }

  const subscriptions = customer.subscriptions;

  return (
    <div className="flex min-h-full flex-grow flex-col gap-5 px-10">
      <p className="text-3xl font-medium">Subscriptions</p>
      <div>
        {subscriptions.map((s, idx) => {
          console.log(s);
          return (
            <div key={idx} className="border-b border-b-gray-200">
              {s.subscriptionItems.map((si, idx) => {
                return (
                  <div key={idx}>
                    <div className="flex flex-row gap-3 py-2">
                      <p className="font-medium">{si.price.product.name}</p>
                      <p
                        className={classNames(
                          "rounded p-1 text-xs",
                          s.status === "ACTIVE" || s.status === "TRIALING"
                            ? "bg-green-300 text-green-700"
                            : "bg-red-300 text-red-700"
                        )}
                      >
                        {s.status}
                      </p>
                    </div>
                    <p className="font-light text-gray-700">
                      {`$${
                        si.price.unitAmount / 100
                      } per ${si.price.recurring?.interval.toLowerCase()}`}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BillingTab;
