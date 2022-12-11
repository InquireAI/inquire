import { type NextApiRequest, type NextApiResponse } from "next";
import { env } from "../../../../env/server.mjs";
import type { Stripe } from "../../../../server/stripe/client";
import { stripe } from "../../../../server/stripe/client";
import { SubscriptionStatus } from "../../../../server/db/client";
import { prisma } from "../../../../server/db/client";
import { buffer } from "micro";

export const config = {
  api: {
    bodyParser: false,
  },
};

const StatusMap = {
  incomplete: SubscriptionStatus.INCOMPLETE,
  incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
  trialing: SubscriptionStatus.TRIALING,
  active: SubscriptionStatus.ACTIVE,
  past_due: SubscriptionStatus.PAST_DUE,
  canceled: SubscriptionStatus.CANCELED,
  unpaid: SubscriptionStatus.UNPAID,
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
      const subscription = event.data.object as Stripe.Subscription;

      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: StatusMap[subscription.status],
        },
      });
      break;

    case "checkout.session.completed":
      const checkoutSession = event.data.object as Stripe.Checkout.Session;

      const userId = checkoutSession.metadata?.inquire_user_id;

      if (!userId) {
        return res.status(400).json({});
      }

      const customer = await stripe.customers.retrieve(
        checkoutSession.customer as string,
        {
          expand: ["subscriptions"],
        }
      );

      if (customer.deleted) return res.status(400).json({});

      const subscriptions =
        customer.subscriptions as Stripe.ApiList<Stripe.Subscription>;

      await prisma.customer.create({
        data: {
          id: customer.id,
          userId,
        },
      });

      await prisma.subscription.createMany({
        data: subscriptions.data.map((s) => ({
          id: s.id,
          customerId: customer.id,
          status: StatusMap[s.status],
        })),
      });

      break;
  }

  res.status(200).json({});
};

export default handler;
