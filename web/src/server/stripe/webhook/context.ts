import { type PrismaClient } from "../../db/client";
import { type Stripe } from "../../stripe/client";

export type Ctx = {
  prisma: PrismaClient;
  stripe: Stripe;
};
