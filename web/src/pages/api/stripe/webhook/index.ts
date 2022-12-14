import { type NextApiRequest, type NextApiResponse } from "next";
import { env } from "../../../../env/server.mjs";
import type { Stripe } from "../../../../server/stripe/client";
import { stripe } from "../../../../server/stripe/client";
import { prisma } from "../../../../server/db/client";
import { buffer } from "micro";
import { handleCustomerSubscriptionCreated } from "../../../../server/stripe/webhook/customer-subscription-created.js";
import { handleCustomerSubscriptionUpdated } from "../../../../server/stripe/webhook/customer-subscription-updated.js";
import { handleCustomerSubscriptionDeleted } from "../../../../server/stripe/webhook/customer-subscription-deleted.js";
import { handleCheckoutSessionCompleted } from "../../../../server/stripe/webhook/checkout-session-completed.js";
import { handleCheckoutSessionExpired } from "../../../../server/stripe/webhook/checkout-session-expired.js";

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
    case "customer.subscription.created":
      await handleCustomerSubscriptionCreated(event, {
        prisma,
        stripe,
      });

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
  }

  res.status(200).json({});
};

export default handler;
