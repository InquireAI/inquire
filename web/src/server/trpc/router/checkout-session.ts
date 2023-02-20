import { TRPCError } from "@trpc/server";
import type Stripe from "stripe";
import { z } from "zod";
import { env } from "../../../env/server.mjs";
import { getBaseUrl } from "../../../utils/get-base-url";
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
            include: {
              subscriptions: true,
            },
          },
        },
      });

      if (!user) {
        ctx.logger.warn(
          `Could not retrieve user with id: ${ctx.session.user.id}`
        );
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid user",
        });
      }

      if (!user.customer) {
        // this is an error level log because the customer should get created for the user on sign up
        ctx.logger.error(
          `User: ${ctx.session.user.id} does not have a customer`
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User is missing a stripe customer",
        });
      }

      if (user.customer.subscriptions.length) {
        ctx.logger.error(
          `User: ${ctx.session.user.id} is already subscribed and can not subscribe again`
        );
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `User is already subscribed can not subscribe again`,
        });
      }

      ctx.logger.info(`User: ${ctx.session.user.id} has valid customer`);

      const stripeCheckoutSession: Stripe.Checkout.Session =
        await stripe.checkout.sessions.create({
          customer: user.customer.id,
          mode: "subscription",
          success_url: `${getBaseUrl()}${input.successUrl}`,
          cancel_url: `${getBaseUrl()}${input.cancelUrl}`,
          line_items: [
            {
              price: env.STRIPE_PRICE_ID,
              quantity: 1,
            },
          ],
        });

      if (!stripeCheckoutSession.url) {
        ctx.logger.error(`Checkout session created without a url`);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Checkout session created without a url",
        });
      }

      ctx.logger.info(
        `Checkout session: ${stripeCheckoutSession.id} created in stripe`
      );

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

      ctx.logger.info(`Checkout session: ${checkoutSession.id} created in db`);

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

      if (!user) {
        ctx.logger.warn(
          `Could not retrieve user with id: ${ctx.session.user.id}`
        );
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid user",
        });
      }

      if (!user.customer) {
        // this is an error level log because the customer should get created for the user on sign up
        ctx.logger.error(
          `User: ${ctx.session.user.id} does not have a customer`
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User is missing a stripe customer",
        });
      }

      ctx.logger.info(`User: ${ctx.session.user.id} has valid customer`);

      const stripeCheckoutSession: Stripe.Checkout.Session =
        await stripe.checkout.sessions.create({
          customer: user.customer.id,
          mode: "setup",
          setup_intent_data: {
            metadata: { subscriptionId: input.subscriptionId },
          },
          automatic_tax: {
            enabled: true,
          },
          payment_method_types: ["card"],
          success_url: `${getBaseUrl()}${input.successUrl}`,
          cancel_url: `${getBaseUrl()}${input.cancelUrl}`,
        });

      if (!stripeCheckoutSession.url) {
        ctx.logger.error(`Checkout session created without a url`);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Checkout session created without a url",
        });
      }

      ctx.logger.info(
        `Checkout session: ${stripeCheckoutSession.id} created in stripe`
      );

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

      ctx.logger.info(`Checkout session: ${checkoutSession.id} created in db`);

      return checkoutSession;
    }),
});
