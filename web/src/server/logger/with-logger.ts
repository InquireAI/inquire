import type { NextApiRequest, NextApiResponse } from "next";
import type { ILogger } from "./index";
import { Logger } from "./index";
import Pino from "pino";
import { env } from "../../env/server.mjs";
import { randomUUID } from "crypto";

const pino = Pino({
  level:
    env.NODE_ENV === "development"
      ? "debug"
      : env.NODE_ENV === "test"
      ? "silent"
      : "info",
  formatters: {
    level: (label) => {
      return {
        level: label.toUpperCase(),
      };
    },
  },
  mixin() {
    return {
      requestId: randomUUID(),
    };
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

    try {
      await handler(logRequest, res);
    } catch (error) {
      logger.error("Request failed with 500 status code", {
        request: {
          path: req.url,
          method: req.method,
          host: req.headers["host"],
          userAgent: req.headers["user-agent"],
          scheme: "https",
          ip: req.headers["x-forwarded-for"],
          statusCode: 500,
        },
      });

      res.status(500);

      throw error;
    } finally {
      logger.info("End Request", {
        request: {
          path: req.url,
          method: req.method,
          host: req.headers["host"],
          userAgent: req.headers["user-agent"],
          scheme: "https",
          ip: req.headers["x-forwarded-for"],
          statusCode: res.statusCode,
        },
      });
    }
  };
}
