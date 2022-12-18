import type { NextApiRequest, NextApiResponse } from "next";

export async function createInquiry(_: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({});
}
