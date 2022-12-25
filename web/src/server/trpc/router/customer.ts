import { TRPCError } from "@trpc/server";
import type Stripe from "stripe";
import { router, protectedProcedure } from "../trpc";

export const customerRouter = router({
  getCustomerData: protectedProcedure.query(async ({ ctx }) => {
    const customer = await ctx.prisma.customer.findUnique({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        subscriptions: {
          include: {
            defaultPaymentMethod: true,
            subscriptionItems: {
              include: {
                price: {
                  include: {
                    product: true,
                    recurring: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!customer)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Billing information not found",
      });

    return {
      ...customer,
      subscriptions: customer.subscriptions.map((s) => {
        return {
          ...s,
          defaultPaymentMethod: {
            ...s.defaultPaymentMethod,
            card: s.defaultPaymentMethod.card as Stripe.Card | null | undefined,
          },
        };
      }),
    };
  }),
});
