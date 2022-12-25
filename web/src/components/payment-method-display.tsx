import { CreditCardIcon } from "@heroicons/react/24/outline";

type Props = {
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
      <div className="flex flex-row items-center gap-4 font-medium">
        <CreditCardIcon
          className="rounded bg-rose-700 p-2 text-white"
          height={50}
          width={50}
        />
        <div className="flex flex-col text-gray-600">
          <p className="font-medium">
            {brand.toUpperCase()} ending in {last4}
          </p>
          <p className="font-light">Expires on {expDate}</p>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentMethodDisplay;
