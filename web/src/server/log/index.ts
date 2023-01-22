/* eslint-disable @typescript-eslint/no-explicit-any */
import { log as axiomLog, type Logger as AxiomLogger } from "next-axiom";

type DebugArgs = {
  [key: string]: any;
};

type InfoArgs =
  | {
      type: "DATABASE_CALL";
      resource: {
        name: "Connection";
        connectionUserId: string;
        connectionType: string;
      };
    }
  | {
      type: "BAD_REQUEST";
      error: { [key: string]: any };
    }
  | {
      [key: string]: any;
    };

type WarnArgs = {
  [key: string]: any;
};

type ErrorArgs =
  | {
      type: "BAD_REQUEST";
      error: { [key: string]: any };
      [key: string]: any;
    }
  | {
      [key: string]: any;
    };

class Logger {
  constructor(private log: AxiomLogger) {}

  debug(message: string, args?: DebugArgs) {
    this.log.debug(message, args);
  }

  info(message: string, args?: InfoArgs) {
    this.log.debug(message, args);
  }

  warn(message: string, args?: WarnArgs) {
    this.log.warn(message, args);
  }

  error(message: string, args?: ErrorArgs) {
    this.log.error(message, args);
  }
}

export const log = new Logger(axiomLog);
