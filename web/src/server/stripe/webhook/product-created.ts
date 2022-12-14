import type { Stripe } from "../client";
import type { Ctx } from "./context";

export const handleProductCreated = async (event: Stripe.Event, ctx: Ctx) => {
  const product = event.data.object as Stripe.Product;

  await ctx.prisma.product.create({
    data: {
      id: product.id,
      name: product.name,
      active: product.active,
    },
  });
};
