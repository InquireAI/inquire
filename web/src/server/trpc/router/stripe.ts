import { TRPCError } from "@trpc/server";
import type Stripe from "stripe";
import { z } from "zod";
import { env } from "../../../env/server.mjs";
import { stripe } from "../../stripe/client";
import { router, protectedProcedure } from "../trpc";

export const stripeRouter = router({
  getPaymentLink: protectedProcedure
    .input(
      z.object({
        redirectUrl: z.string(),
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

      if (user.customer)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already has customer cannot",
        });

      const link: Stripe.PaymentLink = await stripe.paymentLinks.create({
        after_completion: {
          type: "redirect",
          redirect: { url: input.redirectUrl },
        },
        metadata: {
          inquire_user_id: ctx.session.user.id,
        },
        line_items: [
          {
            price: env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
      });

      await ctx.prisma.paymentLink.create({
        data: {
          id: link.id,
          active: link.active,
          url: link.url,
          userId: ctx.session.user.id,
        },
      });

      return link;
    }),
});
