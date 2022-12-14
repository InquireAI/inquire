import type { Stripe } from "../client";
import type { Ctx } from "./context";

export const handleProductDeleted = async (event: Stripe.Event, ctx: Ctx) => {
  const product = event.data.object as Stripe.Product;

  await ctx.prisma.product.delete({
    where: {
      id: product.id,
    },
  });
};
