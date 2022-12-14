import type { Stripe } from "../client";
import { SubscriptionStatusMap } from "../utils";
import type { Ctx } from "./context";

export const handleCustomerSubscriptionCreated = async (
  event: Stripe.Event,
  ctx: Ctx
) => {
  const subscription = event.data.object as Stripe.Subscription;

  await ctx.prisma.subscription.create({
    data: {
      id: subscription.id,
      customerId: subscription.customer as string,
      status: SubscriptionStatusMap[subscription.status],
    },
  });
};
