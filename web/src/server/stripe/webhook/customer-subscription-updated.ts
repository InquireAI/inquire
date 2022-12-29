import type { Stripe } from "../client";
import type { Prisma } from "../../db/client";
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
  const subscription = await ctx.stripe.subscriptions.retrieve(id, {
    expand: ["default_payment_method"],
  });

  const defaultPaymentMethod =
    subscription.default_payment_method as Stripe.PaymentMethod;

  await ctx.prisma.subscription.upsert({
    where: {
      id: subscription.id,
    },
    create: {
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      customer: {
        connect: {
          id: subscription.customer as string,
        },
      },
      defaultPaymentMethod: {
        connectOrCreate: {
          where: {
            id: defaultPaymentMethod.id,
          },
          create: {
            id: defaultPaymentMethod.id,
            type: defaultPaymentMethod.type,
            card: defaultPaymentMethod.card as unknown as Prisma.JsonObject,
            customer: {
              connect: {
                id: defaultPaymentMethod.customer as string,
              },
            },
          },
        },
      },
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
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
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      defaultPaymentMethod: {
        connectOrCreate: {
          where: {
            id: defaultPaymentMethod.id,
          },
          create: {
            id: defaultPaymentMethod.id,
            type: defaultPaymentMethod.type,
            card: defaultPaymentMethod.card as unknown as Prisma.JsonObject,
            customer: {
              connect: {
                id: defaultPaymentMethod.customer as string,
              },
            },
          },
        },
      },
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
};
