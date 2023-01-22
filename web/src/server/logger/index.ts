/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Logger as AxiomLogger } from "next-axiom";

type DebugArgs = {
  [key: string]: any;
};

type InfoArgs =
  | {
      type: "DATABASE_CALL";
      resource:
        | {
            name: "Connection";
            connectionUserId?: string;
            connectionType?: string;
          }
        | {
            name: "Persona";
            id?: string;
          };
    }
  | {
      type: "BAD_REQUEST";
      error: { [key: string]: any };
    }
  | {
      type: "OPENAI_CALL";
      error: { [key: string]: any };
    }
  | {
      type: "DUST_CALL";
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
      type: "DATABASE_CALL";
      resource:
        | {
            name: "Connection";
            connectionUserId?: string;
            connectionType?: string;
          }
        | {
            name: "Persona";
            id?: string;
          };
    }
  | {
      type: "BAD_REQUEST";
      error: { [key: string]: any };
      [key: string]: any;
    }
  | {
      type: "BAD_REQUEST";
      error: { [key: string]: any };
    }
  | {
      type: "OPENAI_CALL";
      error: { [key: string]: any };
    }
  | {
      type: "DUST_CALL";
      error: { [key: string]: any };
    }
  | {
      [key: string]: any;
    };

export class Logger {
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