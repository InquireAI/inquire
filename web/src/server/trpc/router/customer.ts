import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";

export const customerRouter = router({
  customerByCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const customer = await ctx.prisma.customer.findUnique({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        subscriptions: true,
      },
    });

    if (!customer)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Billing information not found",
      });

    return customer;
  }),
});
