import { TRPCError } from "@trpc/server";
import type Stripe from "stripe";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { stripe } from "../../stripe/client";

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

    if (!customer) {
      ctx.logger.info(
        `Could not find billing info for user: ${ctx.session.user.id}`
      );

      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Billing information not found",
      });
    }

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
  cancelSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const subscription = await ctx.prisma.subscription.findFirst({
        where: {
          id: input.subscriptionId,
          customer: {
            userId: ctx.session.user.id,
          },
        },
      });

      if (!subscription) {
        ctx.logger.info(
          `Could not find subscription: ${input.subscriptionId} belonging to ${ctx.session.user.id}`
        );
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Subscription with id ${input.subscriptionId} not found`,
        });
      }

      ctx.logger.info(
        `Found subscription: ${input.subscriptionId} belong to ${ctx.session.user.id}`
      );

      // allow customer to still use service until the end of the period they have already paid for
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });

      ctx.logger.info(
        `Successfully cancelled subscription: ${input.subscriptionId} for user: ${ctx.session.user.id}`
      );

      return null;
    }),
  reactivateSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const subscription = await ctx.prisma.subscription.findFirst({
        where: {
          id: input.subscriptionId,
          customer: {
            userId: ctx.session.user.id,
          },
        },
      });

      if (!subscription) {
        ctx.logger.info(
          `Could not find subscription: ${input.subscriptionId} belonging to ${ctx.session.user.id}`
        );
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Subscription with id ${input.subscriptionId} not found`,
        });
      }

      ctx.logger.info(
        `Found subscription: ${input.subscriptionId} belong to ${ctx.session.user.id}`
      );

      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });

      ctx.logger.info(
        `Successfully reactivated subscription: ${input.subscriptionId} for user: ${ctx.session.user.id}`
      );

      return null;
    }),
});
