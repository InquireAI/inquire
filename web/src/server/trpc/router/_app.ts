import { router } from "../trpc";
import { userRouter } from "./user";
import { customerRouter } from "./customer";
import { checkoutSessionRouter } from "./checkout-session";
import { connectionRouter } from "./connection";

export const appRouter = router({
  user: userRouter,
  customer: customerRouter,
  checkoutSession: checkoutSessionRouter,
  connection: connectionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
