import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";

export const userRouter = router({
  currentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
    });

    if (!user) {
      ctx.logger.info(`Could not find user: ${ctx.session.user.id}`);
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    ctx.logger.info(`Retrieved user: ${user.id}`);
    return user;
  }),
  connections: protectedProcedure.query(async ({ ctx }) => {
    const connections = await ctx.prisma.connection.findMany({
      where: {
        userId: ctx.session.user.id,
      },
    });

    ctx.logger.info(`Retrieved connections for user: ${ctx.session.user.id}`);

    return connections;
  }),
});
