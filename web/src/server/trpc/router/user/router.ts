import { protectedProcedure, router } from "../../trpc";
import { currentUserHandler, UserNotFoundError } from "./current-user-handler";
import { getUserById } from "@/server/db/user";
import { TRPCError } from "@trpc/server";
import { currentUserConnectionsHandler } from "./current-user-connections-handler";
import { getConnectionsByUserId } from "@/server/db/connections";

export const userRouter = router({
  currentUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      return currentUserHandler(ctx.session.user.id, {
        getUserById,
        logger: ctx.logger,
      });
    } catch (error) {
      if (error instanceof UserNotFoundError)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });

      throw error;
    }
  }),
  connections: protectedProcedure.query(async ({ ctx }) => {
    return currentUserConnectionsHandler(ctx.session.user.id, {
      getConnectionsByUserId,
      logger: ctx.logger,
    });
  }),
});
