import { log as axiomLog, type Logger as AxiomLogger } from "next-axiom";

type DebugArgs = {
  [key: string]: unknown;
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
      error: { [key: string]: unknown };
    }
  | {
      [key: string]: unknown;
    };

type WarnArgs = {
  [key: string]: unknown;
};

type ErrorArgs =
  | {
      type: "BAD_REQUEST";
      error: { [key: string]: unknown };
      [key: string]: unknown;
    }
  | {
      [key: string]: unknown;
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
