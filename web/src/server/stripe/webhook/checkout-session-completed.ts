import type { Stripe } from "../client";
import type { Ctx } from "./context";

export const handleCheckoutSessionCompleted = async (
  event: Stripe.Event,
  ctx: Ctx
) => {
  const checkoutSession = event.data.object as Stripe.Checkout.Session;

  // TODO: handle checkout session if mode is setup.
  // should check for subscriptionId in metadata and update the subscriptions default payment method
  // via the setup intent

  if (checkoutSession.mode === "setup") {
    const setupIntent = await ctx.stripe.setupIntents.retrieve(
      checkoutSession.setup_intent as string
    );

    const subscriptionId = setupIntent.metadata?.subscriptionId;

    if (!subscriptionId) throw new Error("Unprocessable");

    await ctx.stripe.subscriptions.update(subscriptionId, {
      default_payment_method: setupIntent.payment_method as string,
    });
  }

  await ctx.prisma.checkoutSession.update({
    where: {
      id: checkoutSession.id,
    },
    data: {
      status: checkoutSession.status,
    },
  });
};
