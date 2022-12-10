import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "../../../env/server.mjs";
import { router, protectedProcedure } from "../trpc";
// import { createHmac } from "crypto";

//  id, first_name, last_name, username, photo_url, auth_date and hash fields

type ValidateTelgramHashArgs = {
  hash: string;
  dataCheckString: string;
  secretKey: string;
};

function validateTelegramHash(args: ValidateTelgramHashArgs) {
  console.log(args);
  // const hmac = createHmac("sha256", args.secretKey);
  // const hexString = hmac.update(args.dataCheckString).digest("hex");
  // return hexString === args.hash;

  return true;
}

export const telegramRouter = router({
  connectTelegramAccount: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        username: z.string(),
        photoUrl: z.string(),
        authDate: z.string(),
        hash: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const dataCheckString = Object.values(input).join("\n");
      if (
        !validateTelegramHash({
          hash: input.hash,
          dataCheckString,
          secretKey: env.TELEGRAM_SECRET_KEY,
        })
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Failed to authorize your telegram account. Please try again",
        });
      }

      const user = await ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          telegramId: input.id,
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
