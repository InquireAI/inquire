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
      const link = await stripe.paymentLinks.create({
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

      return link;
    }),
});
