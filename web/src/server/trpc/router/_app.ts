import { router } from "../trpc";
import { authRouter } from "./auth";
import { telegramRouter } from "./telegram";
import { userRouter } from "./user";
import { customerRouter } from "./customer";
import { checkoutSessionRouter } from "./checkout-session";

export const appRouter = router({
  auth: authRouter,
  telegram: telegramRouter,
  user: userRouter,
  customer: customerRouter,
  checkoutSession: checkoutSessionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
