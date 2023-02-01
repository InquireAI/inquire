import { prisma } from "../../../../db/client";

type Args = {
  status?: "REQUESTED" | "COMPLETED" | "FAILED";
  result?: string | null;
};

export async function updateInquiry(id: string, args: Args) {
  return await prisma.inquiry.update({
    where: {
      id,
    },
    data: {
      status: args.status,
      result: args.result,
    },
  });
}
