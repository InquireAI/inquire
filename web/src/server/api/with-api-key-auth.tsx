import type { NextApiResponse } from "next";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "../db/client";
import type {
  NextApiHandlerWithLogger,
  NextApiRequestWithLogger,
} from "../logger/with-logger";

const ApiKeySchema = z.string();

export function withApiKeyAuth(handler: NextApiHandlerWithLogger) {
  return async function (req: NextApiRequestWithLogger, res: NextApiResponse) {
    const { logger } = req;

    const apiKeyParse = await ApiKeySchema.spa(req.headers["x-api-key"]);

    if (!apiKeyParse.success) {
      logger.info(`Invalid API key`, {
        type: "BAD_REQUEST",
        error: apiKeyParse.error,
      });
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

    logger.info("Api Key is valid");

    if (!dbApikey) {
      logger.info("Could not find api key");
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      });
    }

    await handler(req, res);
  };
}
