// @ts-check
import { z } from "zod";

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXTAUTH_SECRET:
    process.env.NODE_ENV === "production"
      ? z.string().min(1)
      : z.string().min(1).optional(),
  NEXTAUTH_URL: z.preprocess(
    // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
    // Since NextAuth.js automatically uses the VERCEL_URL if present.
    (str) => process.env.VERCEL_URL ?? str,
    // VERCEL_URL doesn't include `https` so it cant be validated as a URL
    process.env.VERCEL ? z.string() : z.string().url()
  ),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  TELEGRAM_SECRET_KEY: z.string(),
  STRIPE_API_KEY: z.string(),
  STRIPE_PRICE_ID: z.string(),
  STRIPE_WH_SECRET: z.string(),
  OPENAI_API_KEY: z.string(),
  DUST_API_KEY: z.string(),
  USER_INQUIRY_LIMIT: z.string().transform((str) => parseInt(str, 10)),
  ALGOLIA_ADMIN_KEY: z.string(),
  ALGOLIA_PERSONA_INDEX_NAME: z.string(),
  ALGOLIA_APP_ID: z.string(),
  ALGOLIA_SEARCH_KEY: z.string(),
});

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_STRIPE_PUB_KEY: z.string(),
  NEXT_PUBLIC_ALGOLIA_PERSONA_INDEX_NAME: z.string(),
  NEXT_PUBLIC_ALGOLIA_APP_ID: z.string(),
  NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: z.string(),
});

/**
 * You can't destruct `process.env` as a regular object, so you have to do
 * it manually here. This is because Next.js evaluates this at build time,
 * and only used environment variables are included in the build.
 * @type {{ [k in keyof z.infer<typeof clientSchema>]: z.infer<typeof clientSchema>[k] | undefined }}
 */
export const clientEnv = {
  NEXT_PUBLIC_STRIPE_PUB_KEY: process.env.NEXT_PUBLIC_STRIPE_PUB_KEY,
  NEXT_PUBLIC_ALGOLIA_PERSONA_INDEX_NAME:
    process.env.NEXT_PUBLIC_ALGOLIA_PERSONA_INDEX_NAME,
  NEXT_PUBLIC_ALGOLIA_APP_ID: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY,
};
