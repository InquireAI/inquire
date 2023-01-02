import { trpc } from "../utils/trpc";
import SubscribeButton from "./subscribe-button";
import PaymentMethodDisplay from "./payment-method-display";
import Skeleton from "react-loading-skeleton";
import Switch from "./switch";
import SubscriptionDisplay from "./subscription-display";

const BillingTab: React.FC = () => {
  const { data: customer, isLoading } =
    trpc.customer.getCustomerData.useQuery();

  if (!isLoading && !customer) {
    return <p>Couldn&apos;t find you billing information</p>;
  }

  if (!isLoading && !customer.subscriptions.length) {
    return (
      <div className="flex min-h-full flex-grow flex-col items-center justify-center gap-2 font-medium">
        <div className="flex w-full flex-col justify-evenly gap-5 rounded-xl border border-neutral-200 bg-neutral-100 p-10 md:w-1/2 lg:w-1/3">
          <div className="w-full">
            <div className="border-b border-neutral-300">
              <p className="mb-2 text-4xl">Premium</p>
              <p className="text-sm">Super-charge your ai assistant</p>
            </div>
          </div>
          <div>
            <p className="text-4xl">$5</p>
            <p className="text-sm text-neutral-600">per month</p>
          </div>
          <SubscribeButton />
          <ul className="list-disc items-center px-5 text-base font-light text-neutral-600">
            <li>Unlimited Inquiries</li>
            <li>Access to all inquire prompts</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-grow flex-col gap-5 px-10">
      <Switch
        isOn={!isLoading}
        onComponent={<p className="text-3xl font-medium">Subscription</p>}
        offComponent={<Skeleton className="h-10" />}
      />
      <Switch
        isOn={!isLoading}
        offComponent={<Skeleton className="h-20" count={2} />}
        onComponent={
          <div>
            {customer?.subscriptions.map((s, idx) => {
              return (
                <div
                  key={idx}
                  className="flex flex-col gap-12 rounded-lg border border-neutral-900 p-8 text-lg"
                >
                  <Switch
                    isOn={!isLoading}
                    onComponent={<SubscriptionDisplay subscription={s} />}
                    offComponent={<Skeleton className="h-20" />}
                  />
                  <Switch
                    isOn={!isLoading}
                    onComponent={
                      <PaymentMethodDisplay
                        subscriptionId={s.id}
                        paymentMethod={{
                          card: s.defaultPaymentMethod.card && {
                            last4: s.defaultPaymentMethod.card.last4,
                            brand: s.defaultPaymentMethod.card.brand,
                            expMonth: s.defaultPaymentMethod.card.exp_month,
                            expYear: s.defaultPaymentMethod.card.exp_year,
                          },
                        }}
                      />
                    }
                    offComponent={<Skeleton className="h-20" />}
                  />
                </div>
              );
            })}
          </div>
        }
      />
    </div>
  );
};

export default BillingTab;
