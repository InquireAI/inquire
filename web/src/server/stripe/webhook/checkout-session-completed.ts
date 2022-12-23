import type { Stripe } from "../client";
import { CheckoutSessionStatusMap } from "../utils";
import type { Ctx } from "./context";

export const handleCheckoutSessionCompleted = async (
  event: Stripe.Event,
  ctx: Ctx
) => {
  const checkoutSession = event.data.object as Stripe.Checkout.Session;

  // TODO: handle checkout session if mode is setup.
  // should check for subscriptionId in metadata and update the subscriptions default payment method
  // via the setup intent

  await ctx.prisma.checkoutSession.update({
    where: {
      id: checkoutSession.id,
    },
    data: {
      status:
        checkoutSession.status &&
        CheckoutSessionStatusMap[checkoutSession.status],
    },
  });
};
