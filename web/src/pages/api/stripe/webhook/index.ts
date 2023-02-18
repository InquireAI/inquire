import { type NextApiRequest, type NextApiResponse } from "next";
import { env } from "@/env/server.mjs";
import type { Stripe } from "@/server/stripe/client";
import { stripe } from "@/server/stripe/client";
import { prisma } from "@/server/db/client";
import { buffer } from "micro";
import { handleCustomerSubscriptionUpdated } from "@/server/stripe/webhook/customer-subscription-updated";
import { handleCustomerSubscriptionDeleted } from "@/server/stripe/webhook/customer-subscription-deleted";
import { handleCheckoutSessionCompleted } from "@/server/stripe/webhook/checkout-session-completed";
import { handleCheckoutSessionExpired } from "@/server/stripe/webhook/checkout-session-expired";
import { handleProductCreated } from "@/server/stripe/webhook/product-created";
import { handleProductUpdated } from "@/server/stripe/webhook/product-updated";
import { handlePriceCreated } from "@/server/stripe/webhook/price-created";
import { handlePriceUpdated } from "@/server/stripe/webhook/price-updated";

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const stripeSignature = req.headers["stripe-signature"];

  if (!stripeSignature) return res.status(403).json({});

  let event: Stripe.Event | undefined = undefined;

  try {
    event = await stripe.webhooks.constructEventAsync(
      await buffer(req),
      stripeSignature,
      env.STRIPE_WH_SECRET
    );
  } catch (error) {
    return res.status(403).json({});
  }

  switch (event.type) {
    case "customer.subscription.updated":
      await handleCustomerSubscriptionUpdated(event, {
        prisma,
        stripe,
      });
      break;

    case "customer.subscription.deleted":
      await handleCustomerSubscriptionDeleted(event, {
        prisma,
        stripe,
      });

      break;

    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event, {
        stripe,
        prisma,
      });
      break;

    case "checkout.session.expired":
      await handleCheckoutSessionExpired(event, {
        stripe,
        prisma,
      });
      break;

    case "product.created":
      await handleProductCreated(event, {
        stripe,
        prisma,
      });
      break;

    case "product.updated":
      await handleProductUpdated(event, {
        stripe,
        prisma,
      });
      break;

    case "product.deleted":
      await handleProductUpdated(event, {
        stripe,
        prisma,
      });
      break;

    case "price.created":
      await handlePriceCreated(event, {
        stripe,
        prisma,
      });
      break;

    case "price.updated":
      await handlePriceUpdated(event, {
        stripe,
        prisma,
      });
      break;
  }

  res.status(200).json({});
};

export default handler;
