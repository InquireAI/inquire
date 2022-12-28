import type { Stripe } from "../client";
import type { Ctx } from "./context";

export const handlePriceUpdated = async (event: Stripe.Event, ctx: Ctx) => {
  const price = event.data.object as Stripe.Price;

  await ctx.prisma.price.update({
    where: {
      id: price.id,
    },
    data: {
      type: price.type,
      active: price.active,
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
