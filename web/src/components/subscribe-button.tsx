import { trpc } from "../utils/trpc";
import Spinner from "./spinner";

const SubscribeButton: React.FC = () => {
  const { mutate: createCheckoutSession, isLoading } =
    trpc.checkoutSession.createPremiumCheckoutSession.useMutation({
      onSuccess(data) {
        window.location.replace(data.url);
      },
    });

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4">
      <button
        className="flex w-full items-center justify-center rounded-md border border-neutral-200 bg-neutral-100 px-10 py-3 font-semibold text-neutral-700 no-underline transition hover:cursor-pointer hover:border-transparent hover:bg-gradient-to-br hover:from-neutral-900 hover:to-neutral-700 hover:text-white"
        onClick={() =>
          createCheckoutSession({
            successUrl: "http://localhost:3000/account",
            cancelUrl: "http://localhost:3000/account",
          })
        }
      >
        {!isLoading ? "Subscribe" : <Spinner />}
      </button>
    </div>
  );
};

export default SubscribeButton;
