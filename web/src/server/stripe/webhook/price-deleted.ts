import type { Stripe } from "../client";
import type { Ctx } from "./context";

export const handlePriceUpdated = async (event: Stripe.Event, ctx: Ctx) => {
  const price = event.data.object as Stripe.Price;

  await ctx.prisma.price.delete({
    where: {
      id: price.id,
    },
  });
};
