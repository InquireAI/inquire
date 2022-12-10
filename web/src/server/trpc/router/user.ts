import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";

export const userRouter = router({
  currentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
    });

    if (!user)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });

    return user;
  }),
});
