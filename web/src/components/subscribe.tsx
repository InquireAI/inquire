import { trpc } from "../utils/trpc";
import Spinner from "./spinner";

const Subscribe: React.FC = () => {
  const { mutate: createCheckoutSession, isLoading } =
    trpc.checkoutSession.createPremiumCheckoutSession.useMutation({
      onSuccess(data) {
        window.location.replace(data.url);
      },
    });

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4">
      <button
        className="flex w-full items-center justify-center rounded-md border border-indigo-200 bg-indigo-100 px-10 py-3 font-semibold text-indigo-700 no-underline transition hover:cursor-pointer hover:border-transparent hover:bg-gradient-to-br hover:from-indigo-900 hover:to-indigo-700 hover:text-white"
        onClick={() =>
          createCheckoutSession({
            successUrl: "http://localhost:3000/checkout/success",
            cancelUrl: "http://localhost:3000/checkout/canceled",
          })
        }
      >
        {!isLoading ? "Subscribe" : <Spinner />}
      </button>
    </div>
  );
};

export default Subscribe;
