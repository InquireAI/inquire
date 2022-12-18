import type { NextApiRequest, NextApiResponse } from "next";

export default async function createInquiry(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(200).json({});
}
