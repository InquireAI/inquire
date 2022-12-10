import Stripe from "stripe";
export { type Stripe } from "stripe";
import { env } from "../../env/server.mjs";

export const stripe = new Stripe(env.STRIPE_API_KEY, {
  apiVersion: "2022-11-15",
});
