import type { NextApiResponse } from "next";
import type { BadRequestRes, SuccessRes } from "../../../api-responses";
import type { Persona } from "../../../../db/client";
import { prisma } from "../../../../db/client";
import type { NextApiRequestWithLogger } from "../../../../logger/with-logger";

type Res = SuccessRes<Persona[]> | BadRequestRes;

export async function listInquiry(
  req: NextApiRequestWithLogger,
  res: NextApiResponse<Res>
) {
  const { logger } = req;

  // query db for all personas available
  const data = await prisma.persona.findMany({});

  logger.info("Successfully retrieved personas", {
    type: "DATABASE_CALL",
    resource: {
      name: "Persona",
    },
  });

  return res.status(200).json({
    data: data,
  });
}
