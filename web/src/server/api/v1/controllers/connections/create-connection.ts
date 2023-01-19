import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import type { Connection } from "../../../../db/client";
import { prisma } from "../../../../db/client";
import type { BadRequestRes, SuccessRes } from "../../../api-responses";
import { zodIssuesToBadRequestIssues } from "../../../utils";
import { log } from "../../../../log";

const BodySchema = z.object({
  userId: z.string().optional(),
  connectionType: z.enum(["WEB", "TELEGRAM"]),
  connectionUserId: z.string(),
});

type Res = SuccessRes<Connection> | BadRequestRes;

export async function createConnection(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  const bodyParse = await BodySchema.spa(req.body);

  if (!bodyParse.success) {
    log.info("Invalid request body", {
      type: "BAD_REQUEST",
      error: bodyParse.error.issues,
    });

    return res.status(400).json({
      code: "BAD_REQUEST",
      message: "Invalid request body",
      issues: zodIssuesToBadRequestIssues(bodyParse.error.issues),
    });
  }

  const { data: bodyData } = bodyParse;

  const connection = await prisma.connection.create({
    data: {
      userId: bodyData.userId,
      connectionType: bodyData.connectionType,
      connectionUserId: bodyData.connectionUserId,
    },
  });

  log.info(
    `Connection with connectionUserId: ${connection.connectionUserId} and connectionType: ${connection.connectionType} created`,
    {
      type: "DATABASE_CALL",
      resource: {
        name: "Connection",
        connectionType: connection.connectionType,
        connectionUserId: connection.connectionUserId,
      },
    }
  );

  return res.status(200).json({
    data: connection,
  });
}
