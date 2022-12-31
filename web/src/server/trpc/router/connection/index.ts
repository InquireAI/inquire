import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { telegramRouter } from "./telegram";
import { ConnectionType } from "../../../db/client";
import { TRPCError } from "@trpc/server";

export const connectionRouter = router({
  telegram: telegramRouter,
  disconnectConnection: protectedProcedure
    .input(
      z.object({
        connectionType: z.nativeEnum(ConnectionType),
        connectionUserId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const connection = await ctx.prisma.connection.findFirst({
        where: {
          userId: ctx.session.user.id,
          connectionType: input.connectionType,
          connectionUserId: input.connectionUserId,
        },
      });

      if (!connection)
        throw new TRPCError({
          code: "NOT_FOUND",
          cause: "Could not find connection",
        });

      // TODO: maybe make an api call to telegram to disconnect from bot?

      await ctx.prisma.connection.delete({
        where: {
          connectionType_connectionUserId: {
            connectionType: input.connectionType,
            connectionUserId: input.connectionUserId,
          },
        },
      });
    }),
});
