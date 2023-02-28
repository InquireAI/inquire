import type { User } from "./client";
import { prisma } from "./client";

export type GetUserByIdFn = (id: string) => Promise<User | null>;

export const getUserById: GetUserByIdFn = async (id: string) => {
  return prisma.user.findUnique({
    where: {
      id: id,
    },
  });
};
