import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "../db/client";
import logger from 'consola'

const ApiKeySchema = z.string();

export function withApiKeyAuth(handler: NextApiHandler) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    const apiKeyParse = await ApiKeySchema.spa(req.headers["x-api-key"]);

    if (!apiKeyParse.success) {
      logger.error(`Invalid API key: ${apiKeyParse.error}`)
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      });
    }

    const hashedApiKey = createHash("sha256")
      .update(apiKeyParse.data)
      .digest("hex");

    const dbApikey = await prisma.apiKey.findUnique({
      where: {
        key: hashedApiKey,
      },
    });

    if (!dbApikey) {
      logger.error(`Invalid DB API key: ${dbApikey}`)
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      });
    }

    await handler(req, res);
  };
}
