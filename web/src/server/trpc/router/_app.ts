import { router } from "../trpc";
import { authRouter } from "./auth";
import { exampleRouter } from "./example";
import { telegramRouter } from "./telegram";
import { userRouter } from "./user";
import { stripeRouter } from "./stripe";
import { customerRouter } from "./customer";

export const appRouter = router({
  example: exampleRouter,
  auth: authRouter,
  telegram: telegramRouter,
  user: userRouter,
  customer: customerRouter,
  stripe: stripeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
