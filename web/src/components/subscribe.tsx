import { useSession } from "next-auth/react";
import { trpc } from "../utils/trpc";

const Subscribe: React.FC = () => {
  const { data: sessionData } = useSession();

  const { mutate: createCheckoutSession } =
    trpc.checkoutSession.createPremiumCheckoutSession.useMutation({
      onSuccess(data) {
        window.location.replace(data.url);
      },
    });

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={() =>
          createCheckoutSession({
            successUrl: "http://localhost:3000/checkout/success",
            cancelUrl: "http://localhost:3000/checkout/canceled",
          })
        }
        disabled={!sessionData}
      >
        {"Subscribe"}
      </button>
    </div>
  );
};

export default Subscribe;
