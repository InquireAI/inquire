import { prisma } from "../../../../db/client";

export async function getInquiryById(id: string) {
  return await prisma.inquiry.findUnique({
    where: {
      id,
    },
  });
}
