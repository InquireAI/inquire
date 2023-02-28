import type { GetConnectionsByUserIdFn } from "@/server/db/connections";
import type { ILogger } from "@/server/logger";

export async function currentUserConnectionsHandler(
  userId: string,
  ctx: { getConnectionsByUserId: GetConnectionsByUserIdFn; logger: ILogger }
) {
  const connections = await ctx.getConnectionsByUserId(userId);

  ctx.logger.info(`Retrieved connections for user: ${userId}`);

  return connections;
}
