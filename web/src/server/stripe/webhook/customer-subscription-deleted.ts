import type { Stripe } from "../client";
import type { Ctx } from "./context";

export const handleCustomerSubscriptionDeleted = async (
  event: Stripe.Event,
  ctx: Ctx
) => {
  const subscription = event.data.object as Stripe.Subscription;

  await ctx.prisma.subscription.delete({
    where: {
      id: subscription.id,
    },
  });
};
