import type { Stripe } from "../client";
import type { Ctx } from "./context";

export const handlePriceCreated = async (event: Stripe.Event, ctx: Ctx) => {
  const price = event.data.object as Stripe.Price;

  await ctx.prisma.price.create({
    data: {
      id: price.id,
      productId: price.product as string,
      active: price.active,
      type: price.type,
      unitAmount: price.unit_amount as number,
      recurring: price.recurring
        ? {
            create: {
              interval: price.recurring.interval,
            },
          }
        : undefined,
    },
  });
};
