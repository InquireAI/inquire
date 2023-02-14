import Pino from "pino";

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
});

interface ILogger {
  debug(message: string, args: { [k: string]: any }): void;
  info(message: string, args: { [k: string]: any }): void;
  warn(message: string, args: { [k: string]: any }): void;
  error(message: string, args: { [k: string]: any }): void;
}

export class Logger implements ILogger {
  debug(message: string, args: { [k: string]: any }): void {
    pino.debug(args, message);
  }

  info(message: string, args: { [k: string]: any }): void {
    pino.info(args, message);
  }

  warn(message: string, args: { [k: string]: any }): void {
    pino.warn(args, message);
  }

  error(message: string, args: { [k: string]: any }): void {
    pino.error(args, message);
  }
}

export const logger = new Logger();
