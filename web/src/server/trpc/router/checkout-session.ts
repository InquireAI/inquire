import { TRPCError } from "@trpc/server";
import type Stripe from "stripe";
import { z } from "zod";
import { env } from "../../../env/server.mjs";
import { stripe } from "../../stripe/client";
import { router, protectedProcedure } from "../trpc";

export const checkoutSessionRouter = router({
  createPremiumCheckoutSession: protectedProcedure
    .input(
      z.object({
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
        include: {
          customer: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!user)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid user",
        });

      if (!user.customer)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is missing a stripe customer",
        });

      const stripeCheckoutSession: Stripe.Checkout.Session =
        await stripe.checkout.sessions.create({
          customer: user.customer.id,
          mode: "subscription",
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          line_items: [
            {
              price: env.STRIPE_PRICE_ID,
              quantity: 1,
            },
          ],
        });

      if (!stripeCheckoutSession.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Checkout session created without a url",
        });
      }

      const checkoutSession = await ctx.prisma.checkoutSession.create({
        data: {
          id: stripeCheckoutSession.id,
          successUrl: stripeCheckoutSession.success_url,
          cancelUrl: stripeCheckoutSession.cancel_url as string,
          mode: stripeCheckoutSession.mode,
          url: stripeCheckoutSession.url,
          customerId: user.customer.id,
          status: stripeCheckoutSession.status,
        },
      });

      return checkoutSession;
    }),
  createSetupCheckoutSession: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
        include: {
          customer: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!user)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid user",
        });

      if (!user.customer)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is missing a stripe customer",
        });

      const stripeCheckoutSession: Stripe.Checkout.Session =
        await stripe.checkout.sessions.create({
          customer: user.customer.id,
          mode: "setup",
          setup_intent_data: {
            metadata: { subscriptionId: input.subscriptionId },
          },
          payment_method_types: ["card"],
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
        });

      if (!stripeCheckoutSession.url)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Checkout session created without a url",
        });

      const checkoutSession = await ctx.prisma.checkoutSession.create({
        data: {
          id: stripeCheckoutSession.id,
          successUrl: stripeCheckoutSession.success_url,
          cancelUrl: stripeCheckoutSession.cancel_url as string,
          mode: stripeCheckoutSession.mode,
          url: stripeCheckoutSession.url,
          customerId: user.customer.id,
          status: stripeCheckoutSession.status,
        },
      });

      return checkoutSession;
    }),
});
