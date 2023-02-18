import Pino from "pino";
import type { Logger as PinoLogger } from "pino";

type DebugArgs = {
  [key: string]: any;
};

type InfoArgs = {
  [key: string]: any;
};

type WarnArgs = {
  [key: string]: any;
};

type ErrorArgs = {
  [key: string]: any;
};

export interface ILogger {
  debug(message: string, args?: { [k: string]: any }): void;
  info(message: string, args?: { [k: string]: any }): void;
  warn(message: string, args?: { [k: string]: any }): void;
  error(message: string, args?: { [k: string]: any }): void;
}

type LoggerOptions = {
  baseLogArgs?: { [k: string]: any };
};

export class Logger implements ILogger {
  constructor(private log: PinoLogger, private options?: LoggerOptions) {}

  private getLogArgs(args?: { [k: string]: any }) {
    return { ...args, ...this.options?.baseLogArgs };
  }

  debug(message: string, args?: DebugArgs) {
    this.log.debug(this.getLogArgs(args), message);
  }

  info(message: string, args?: InfoArgs) {
    this.log.info(this.getLogArgs(args), message);
  }

  warn(message: string, args?: WarnArgs) {
    this.log.warn(this.getLogArgs(args), message);
  }

  error(message: string, args?: ErrorArgs) {
    this.log.error(this.getLogArgs(args), message);
  }

  setOptions(options: LoggerOptions) {
    this.options = options;
  }
}
const pino = Pino({
  level:
    process.env.NODE_ENV === "development"
      ? "debug"
      : process.env.NODE_ENV === "test"
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
      app: "inquiry-completer",
    };
  },
});

export const logger = new Logger(pino);
