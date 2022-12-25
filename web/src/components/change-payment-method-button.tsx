import { PencilIcon } from "@heroicons/react/24/outline";
import { trpc } from "../utils/trpc";
import Spinner from "./spinner";

type Props = {
  subscriptionId: string;
};

const ChangePaymentMethodButton: React.FC<Props> = ({ subscriptionId }) => {
  const { mutate: createCheckoutSession, isLoading } =
    trpc.checkoutSession.createSetupCheckoutSession.useMutation({
      onSuccess(data) {
        window.location.replace(data.url);
      },
    });

  return (
    <button
      className="flex flex-row items-center justify-center gap-1 rounded-lg px-2 py-1 font-medium text-gray-700 hover:border-transparent hover:bg-gray-700 hover:text-white"
      onClick={() =>
        createCheckoutSession({
          successUrl: "http://localhost:3000/account",
          cancelUrl: "http://localhost:3000/account",
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

export default ChangePaymentMethodButton;
