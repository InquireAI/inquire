import middy from "@middy/core";
import { logger } from "../utils/logger";
import { randomUUID } from "crypto";

export const loggerMiddleware = <
  Event = any,
  Result = any
>(): middy.MiddlewareObj<Event, Result> => {
  const before: middy.MiddlewareFn<Event, Result> = (request) => {
    logger.setOptions({
      baseLogArgs: { requestId: randomUUID() },
    });

    logger.info("Start Lambda");
  };

  const after: middy.MiddlewareFn<Event, Result> = (request) => {
    logger.info("End Lambda", { err: request.error });
  };

  const onError: middy.MiddlewareFn<Event, Result> = (request) => {
    logger.error("Inquiry requested handler failed", { err: request.error });
  };

  return {
    before,
    after,
    onError,
  };
};
