import { type NextApiRequest, type NextApiResponse } from "next";
import { env } from "../../../../env/server.mjs";
import type { Stripe } from "../../../../server/stripe/client";
import { stripe } from "../../../../server/stripe/client";
// import { prisma } from "../../../../server/db/client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const stripeSignature = req.headers["stripe-signature"];

  if (!stripeSignature) return res.status(403).json({});

  let event: Stripe.Event | undefined = undefined;

  try {
    event = await stripe.webhooks.constructEventAsync(
      JSON.stringify(req.body),
      stripeSignature,
      env.STRIPE_WH_SECRET
    );
  } catch (error) {
    return res.status(403).json({});
  }

  console.log(event);

  console.log(req.body);
  console.log(req.headers);
  res.status(500).json({});
};

export default handler;
