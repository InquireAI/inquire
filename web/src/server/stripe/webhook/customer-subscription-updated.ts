import type { Stripe } from "../client";
import { SubscriptionStatusMap } from "../utils";
import type { Ctx } from "./context";

/**
 * Handles the stripe customer.subscription.updated event
 *
 * This retrieves the latest subscription data from stripe api
 * and performs an upsert in our db
 * @param event the raw event
 * @param ctx context of the handler
 */
export const handleCustomerSubscriptionUpdated = async (
  event: Stripe.Event,
  ctx: Ctx
) => {
  const { id } = event.data.object as Stripe.Subscription;

  // retrieve most recent subscription data
  const subscription = await ctx.stripe.subscriptions.retrieve(id);

  await ctx.prisma.subscription.upsert({
    where: {
      id: subscription.id,
    },
    create: {
      id: subscription.id,
      customerId: subscription.customer as string,
      status: SubscriptionStatusMap[subscription.status],
      subscriptionItems: {
        createMany: {
          data: subscription.items.data.map((sItem) => {
            return {
              id: sItem.id,
              priceId: sItem.price.id,
            };
          }),
        },
      },
    },
    update: {
      status: SubscriptionStatusMap[subscription.status],
    },
  });
};
