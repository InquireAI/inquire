import type { GetUserByIdFn } from "@/server/db/user";
import type { ILogger } from "@/server/logger";

export class UserNotFoundError extends Error {}

export async function currentUserHandler(
  id: string,
  ctx: { getUserById: GetUserByIdFn; logger: ILogger }
) {
  const user = await ctx.getUserById(id);

  if (!user) {
    ctx.logger.info(`Could not find user: ${id}`);
    throw new UserNotFoundError();
  }

  ctx.logger.info(`Retrieved user: ${id}`);
  return user;
}
