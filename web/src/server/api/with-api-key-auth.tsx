import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "../db/client";

const ApiKeySchema = z.string();

export function withApiKeyAuth(handler: NextApiHandler) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    const apiKeyParse = await ApiKeySchema.spa(req.headers["x-api-key"]);

    if (!apiKeyParse.success)
      return res.status(401).json({
        code: "UNAUTHORIZED",
      });

    const hashedApiKey = createHash("sha256")
      .update(apiKeyParse.data)
      .digest("hex");

    const dbApikey = await prisma.apiKey.findUnique({
      where: {
        key: hashedApiKey,
      },
    });

    if (!dbApikey)
      return res.status(401).json({
        code: "UNAUTHORIZED",
      });

    await handler(req, res);
  };
}
