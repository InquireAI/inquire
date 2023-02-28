import { router } from "../trpc";
import { customerRouter } from "./customer";
import { checkoutSessionRouter } from "./checkout-session";
import { connectionRouter } from "./connection";
import { userRouter } from "./user/router";

export const appRouter = router({
  user: userRouter,
  customer: customerRouter,
  checkoutSession: checkoutSessionRouter,
  connection: connectionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
