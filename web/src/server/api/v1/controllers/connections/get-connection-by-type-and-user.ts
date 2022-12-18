import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import type { Connection } from "../../../../db/client";
import { prisma } from "../../../../db/client";
import type {
  BadRequestRes,
  NotFoundRes,
  SuccessRes,
} from "../../../api-responses";
import { zodIssuesToBadRequestIssues } from "../../../utils";

const QuerySchema = z.object({
  type: z.enum(["WEB", "TELEGRAM"]),
  connectionUserId: z.string(),
});

type Res = SuccessRes<Connection> | BadRequestRes | NotFoundRes;

export async function getConnectionByTypeAndUser(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  const queryParse = await QuerySchema.spa(req.query);

  if (!queryParse.success) {
    return res.status(400).json({
      code: "BAD_REQUEST",
      message: "Invalid query parameters",
      issues: zodIssuesToBadRequestIssues(queryParse.error.issues),
    });
  }

  const { data: queryData } = queryParse;

  const connection = await prisma.connection.findUnique({
    where: {
      connectionType_connectionUserId: {
        connectionType: queryData.type,
        connectionUserId: queryData.connectionUserId,
      },
    },
  });

  if (!connection)
    return res.status(404).json({
      code: "NOT_FOUND",
      message: `Connection with type ${queryData.type} and connectionUserId ${queryData.connectionUserId}`,
    });

  return res.status(200).json({
    data: connection,
  });
}
