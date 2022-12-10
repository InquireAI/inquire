import { router } from "../trpc";
import { authRouter } from "./auth";
import { exampleRouter } from "./example";
import { telegramRouter } from "./telegram";
import { userRouter } from "./user";

export const appRouter = router({
  example: exampleRouter,
  auth: authRouter,
  telegram: telegramRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
