import { TRPCError } from "@trpc/server";
import type Stripe from "stripe";
import { z } from "zod";
import { env } from "../../../env/server.mjs";
import { stripe } from "../../stripe/client";
import {
  CheckoutSessionModeMap,
  CheckoutSessionStatusMap,
} from "../../stripe/utils";
import { router, protectedProcedure } from "../trpc";

export const stripeRouter = router({
  createCheckoutSession: protectedProcedure
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
          cancelUrl: stripeCheckoutSession.cancel_url,
          mode: CheckoutSessionModeMap[stripeCheckoutSession.mode],
          url: stripeCheckoutSession.url,
          customerId: user.customer.id,
          status:
            stripeCheckoutSession.status &&
            CheckoutSessionStatusMap[stripeCheckoutSession.status],
        },
      });

      return checkoutSession;
    }),
});
