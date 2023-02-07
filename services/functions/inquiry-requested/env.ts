import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_HOST: z.string(),
  DATABASE_USERNAME: z.string(),
  DATABASE_PASSWORD: z.string(),
  OPENAI_API_KEY: z.string(),
  DUST_API_KEY: z.string(),
});

export const env = EnvSchema.parse(process.env);
