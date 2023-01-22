import type { AxiomAPIRequest } from "next-axiom";
import { withAxiom } from "next-axiom";
import type { NextApiRequest, NextApiResponse } from "next";
import { Logger } from "./index";

export type NextApiHandlerWithLogger<T = unknown> = (
  res: NextApiRequest & { log: Logger },
  req: NextApiResponse<T>
) => unknown | Promise<unknown>;

export type NextApiRequestWithLogger = NextApiRequest & { log: Logger };

export function withLogger(handler: NextApiHandlerWithLogger) {
  async function f(req: AxiomAPIRequest, res: NextApiResponse) {
    const axiomLog = req.log;
    const log = new Logger(axiomLog);

    const logRequest = req as unknown as NextApiRequestWithLogger;
    logRequest.log = log;

    await handler(logRequest, res);
  }

  return withAxiom(f);
}
