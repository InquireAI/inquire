import type { Stripe } from "../client";
import type { Ctx } from "./context";

export const handleCheckoutSessionExpired = async (
  event: Stripe.Event,
  ctx: Ctx
) => {
  const checkoutSession = event.data.object as Stripe.Checkout.Session;

  await ctx.prisma.checkoutSession.update({
    where: {
      id: checkoutSession.id,
    },
    data: {
      status: checkoutSession.status,
    },
  });
};
