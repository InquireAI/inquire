import type { Stripe } from "../client";
import { PriceTypeMap, RecurringPriceDataIntervalMap } from "../utils";
import type { Ctx } from "./context";

export const handlePriceCreated = async (event: Stripe.Event, ctx: Ctx) => {
  const price = event.data.object as Stripe.Price;

  await ctx.prisma.price.create({
    data: {
      id: price.id,
      productId: price.product as string,
      active: price.active,
      type: PriceTypeMap[price.type],
      unitAmount: price.unit_amount as number,
      recurring: price.recurring
        ? {
            create: {
              interval: RecurringPriceDataIntervalMap[price.recurring.interval],
            },
          }
        : undefined,
    },
  });
};
