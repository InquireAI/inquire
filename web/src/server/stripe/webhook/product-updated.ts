import type { Stripe } from "../client";
import type { Ctx } from "./context";

export const handleProductUpdated = async (event: Stripe.Event, ctx: Ctx) => {
  const product = event.data.object as Stripe.Product;

  await ctx.prisma.product.update({
    where: {
      id: product.id,
    },
    data: {
      name: product.name,
      active: product.active,
    },
  });
};
