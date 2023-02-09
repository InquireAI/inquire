import type { NextApiRequest, NextApiResponse } from "next";
import type { ILogger } from "./index";
import { Logger } from "./index";
import Pino from "pino";

const pino = Pino({
  formatters: {
    level: (label) => {
      return {
        level: label.toUpperCase(),
      };
    },
  },
});

export type NextApiHandlerWithLogger<T = unknown> = (
  res: NextApiRequest & { logger: ILogger },
  req: NextApiResponse<T>
) => unknown | Promise<unknown>;

export type NextApiRequestWithLogger = NextApiRequest & { logger: ILogger };

export function withLogger(handler: NextApiHandlerWithLogger) {
  return async function f(req: NextApiRequest, res: NextApiResponse) {
    const logger = new Logger(pino);

    const logRequest = req as unknown as NextApiRequestWithLogger;
    logRequest.logger = logger;

    logger.info("Start Request", {
      request: {
        path: req.url,
        method: req.method,
        host: req.headers["host"],
        userAgent: req.headers["user-agent"],
        scheme: "https",
        ip: req.headers["x-forwarded-for"],
        statusCode: req.statusCode,
      },
    });

    await handler(logRequest, res);

    logger.info("End Request", {
      request: {
        path: req.url,
        method: req.method,
        host: req.headers["host"],
        userAgent: req.headers["user-agent"],
        scheme: "https",
        ip: req.headers["x-forwarded-for"],
        statusCode: req.statusCode,
      },
    });
  };
}
