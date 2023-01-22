import type { AxiomAPIRequest, Logger as AxiomLogger } from "next-axiom";
import { withAxiom } from "next-axiom";
import type { NextApiRequest, NextApiResponse } from "next";
import { Logger } from "./index";

export type NextApiHandlerWithLogger<T = unknown> = (
  res: NextApiRequest & { logger: Logger },
  req: NextApiResponse<T>
) => unknown | Promise<unknown>;

export type NextApiRequestWithLogger = NextApiRequest & { logger: Logger };

export function withLogger(handler: NextApiHandlerWithLogger) {
  async function f(req: NextApiRequest, res: NextApiResponse) {
    const axiomReq = req as AxiomAPIRequest;
    const axiomLog = axiomReq.log as AxiomLogger;
    const log = new Logger(axiomLog);

    const logRequest = req as unknown as NextApiRequestWithLogger;
    logRequest.logger = log;

    await handler(logRequest, res);
  }

  return withAxiom(f);
}
