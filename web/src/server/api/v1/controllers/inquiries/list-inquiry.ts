import type { NextApiRequest, NextApiResponse } from "next";
import type { BadRequestRes, SuccessRes } from "../../../api-responses";
import { env } from "../../../../../env/server.mjs";
import { prisma, Persona } from "../../../../db/client";
import logger from 'consola'

type Res = SuccessRes<Persona[]> | BadRequestRes;

export async function listInquiry(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  // query db for all personas available
  let data = await prisma.persona.findMany({ })

  logger.success(`Successfully queried db for personas`)
  return res.status(200).json({
    data: data,
  });
}
