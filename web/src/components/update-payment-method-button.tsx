import { PencilIcon } from "@heroicons/react/24/outline";
import { trpc } from "../utils/trpc";
import Spinner from "./spinner";

type Props = {
  subscriptionId: string;
};

const UpdatePaymentMethodButton: React.FC<Props> = ({ subscriptionId }) => {
  const { mutate: createCheckoutSession, isLoading } =
    trpc.checkoutSession.createSetupCheckoutSession.useMutation({
      onSuccess(data) {
        window.location.replace(data.url);
      },
    });

  return (
    <button
      className="flex flex-grow flex-row items-center justify-center gap-1 rounded-lg border border-gray-200 px-2 py-2 font-medium text-gray-700 hover:border-transparent hover:bg-gray-700 hover:text-white"
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
          Update Payment Method
        </>
      ) : (
        <Spinner />
      )}
    </button>
  );
};

export default UpdatePaymentMethodButton;
