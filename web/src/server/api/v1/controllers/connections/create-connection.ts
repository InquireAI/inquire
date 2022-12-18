import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import type { Connection } from "../../../../db/client";
import { prisma } from "../../../../db/client";
import type { BadRequestRes, SuccessRes } from "../../../api-responses";
import { zodIssuesToBadRequestIssues } from "../../../utils";

const BodySchema = z.object({
  userId: z.string().optional(),
  connectionType: z.enum(["WEB", "TELEGRAM"]),
  connectionUserId: z.string(),
});

type Res = SuccessRes<Connection> | BadRequestRes;

const supportedMethods = ["POST"];

export async function createConnection(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  if (!req.method || !supportedMethods.includes(req.method)) {
    return res.status(400).json({
      code: "BAD_REQUEST",
      message: `Unsupported request method: ${req.method}`,
    });
  }

  const bodyParse = await BodySchema.spa(req.body);

  if (!bodyParse.success) {
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

  return res.status(200).json({
    data: connection,
  });
}
