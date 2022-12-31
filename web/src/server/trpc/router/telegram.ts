import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "../../../env/server.mjs";
import { router, protectedProcedure } from "../trpc";
import { createHash, createHmac } from "crypto";

//  id, first_name, last_name, username, photo_url, auth_date and hash fields

type ValidateTelgramHashArgs = {
  hash: string;
  dataCheckString: string;
  secretKey: string;
};

function validateTelegramHash(args: ValidateTelgramHashArgs) {
  const secret = createHash("sha256").update(args.secretKey).digest();

  const hash = createHmac("sha256", secret)
    .update(args.dataCheckString)
    .digest("hex");

  return hash === args.hash;
}

const InputSchema = z.object({
  id: z.number(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
});

const AUTH_EXPIRATION_LENGTH = 86400;

type TInputSchema = z.infer<typeof InputSchema>;

export const telegramRouter = router({
  connectTelegramAccount: protectedProcedure
    .input(InputSchema)
    .mutation(async ({ input, ctx }) => {
      const dataCheckString = Object.keys(input)
        .filter((key) => key !== "hash")
        .map((key) => `${key}=${input[key as keyof TInputSchema]}`)
        .sort()
        .join("\n");

      console.log(dataCheckString);

      const now = new Date().getTime() / 1000;

      if (now - input.auth_date > AUTH_EXPIRATION_LENGTH)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Auth session has expired",
        });

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

      await ctx.prisma.connection.create({
        data: {
          userId: ctx.session.user.id,
          connectionType: "TELEGRAM",
          connectionUserId: input.id.toString(),
        },
      });

      return null;
    }),
});
