import type { NextApiHandler, NextApiResponse } from "next";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "../db/client";
import type { NextApiRequestWithLogger } from "../log/with-logger";
import { withLogger } from "../log/with-logger";

const ApiKeySchema = z.string();

export function withApiKeyAuth(handler: NextApiHandler) {
  async function f(req: NextApiRequestWithLogger, res: NextApiResponse) {
    const { log } = req;

    const apiKeyParse = await ApiKeySchema.spa(req.headers["x-api-key"]);

    if (!apiKeyParse.success) {
      log.info(`Invalid API key`, {
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

    if (!dbApikey) {
      log.info("Could not find api key");
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      });
    }

    await handler(req, res);
  }

  return withLogger(f);
}
