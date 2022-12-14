import type { Stripe } from "../client";
import { SubscriptionStatusMap } from "../utils";
import type { Ctx } from "./context";

export const handleCustomerSubscriptionDeleted = async (
  event: Stripe.Event,
  ctx: Ctx
) => {
  const subscription = event.data.object as Stripe.Subscription;

  await ctx.prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      status: SubscriptionStatusMap[subscription.status],
    },
  });
};
