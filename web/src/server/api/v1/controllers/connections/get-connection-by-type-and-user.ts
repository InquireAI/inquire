import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "../../../../db/client";

const QuerySchema = z.object({
  type: z.enum(["WEB", "TELEGRAM"]),
  connectionUserId: z.string(),
});

export async function getConnectionByTypeAndUser(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const queryParse = await QuerySchema.spa(req.query);

  if (!queryParse.success) {
    return res.status(400).json({
      code: "BAD_REQUEST",
      errors: queryParse.error.format(),
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
    });

  return connection;
}
