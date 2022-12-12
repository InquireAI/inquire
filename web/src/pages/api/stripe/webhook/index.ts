import { type NextApiRequest, type NextApiResponse } from "next";
import { env } from "../../../../env/server.mjs";
import type { Stripe } from "../../../../server/stripe/client";
import { stripe } from "../../../../server/stripe/client";
import { prisma } from "../../../../server/db/client";
import { buffer } from "micro";
import {
  CheckoutSessionStatusMap,
  SubscriptionStatusMap,
} from "../../../../server/stripe/utils";

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
      const createdSubscription = event.data.object as Stripe.Subscription;

      await prisma.subscription.create({
        data: {
          id: createdSubscription.id,
          customerId: createdSubscription.customer as string,
          status: SubscriptionStatusMap[createdSubscription.status],
        },
      });

      break;

    case "customer.subscription.updated":
      const updatedSubscription = event.data.object as Stripe.Subscription;

      await prisma.subscription.update({
        where: {
          id: updatedSubscription.id,
        },
        data: {
          status: SubscriptionStatusMap[updatedSubscription.status],
        },
      });

      break;

    case "customer.subscription.deleted":
      const deletedSubscription = event.data.object as Stripe.Subscription;

      await prisma.subscription.update({
        where: {
          id: deletedSubscription.id,
        },
        data: {
          status: SubscriptionStatusMap[deletedSubscription.status],
        },
      });

      break;

    case "checkout.session.completed":
      const completedCheckoutSession = event.data
        .object as Stripe.Checkout.Session;

      await prisma.checkoutSession.update({
        where: {
          id: completedCheckoutSession.id,
        },
        data: {
          status:
            completedCheckoutSession.status &&
            CheckoutSessionStatusMap[completedCheckoutSession.status],
        },
      });

      break;

    case "checkout.session.expired":
      const expiredCheckoutSession = event.data
        .object as Stripe.Checkout.Session;

      await prisma.checkoutSession.update({
        where: {
          id: expiredCheckoutSession.id,
        },
        data: {
          status:
            expiredCheckoutSession.status &&
            CheckoutSessionStatusMap[expiredCheckoutSession.status],
        },
      });

      break;
  }

  res.status(200).json({});
};

export default handler;
