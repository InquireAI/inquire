import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string(),
  OPENAI_API_KEY: z.string(),
  DUST_API_KEY: z.string(),
});

export const env = EnvSchema.parse(process.env);
