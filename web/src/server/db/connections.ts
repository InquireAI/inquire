import type { Connection } from "./client";
import { prisma } from "./client";

export type GetConnectionsByUserIdFn = (
  userId: string
) => Promise<Connection[]>;

export const getConnectionsByUserId: GetConnectionsByUserIdFn = async (
  userId: string
) => {
  return prisma.connection.findMany({
    where: {
      userId: userId,
    },
  });
};
