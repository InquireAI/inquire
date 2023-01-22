import type { NextApiRequest, NextApiResponse } from "next";
import type { BadRequestRes, SuccessRes } from "../../../api-responses";
import type { Persona } from "../../../../db/client";
import { prisma } from "../../../../db/client";
import { log } from "../../../../log";

type Res = SuccessRes<Persona[]> | BadRequestRes;

export async function listInquiry(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  // query db for all personas available
  const data = await prisma.persona.findMany({});

  log.info("Successfully retrieved personas", {
    type: "DATABASE_CALL",
    resource: {
      name: "Persona",
    },
  });

  return res.status(200).json({
    data: data,
  });
}
