export type LogLevel = "info" | "debug";

export class Logger {
  constructor(readonly level: LogLevel) {}

  info(...args: unknown[]): void {
    console.log(this.prefix(), ...args);
  }

  debug(...args: unknown[]): void {
    if (this.level === "debug") {
      console.log(this.prefix(), ...args);
    }
  }

  error(...args: unknown[]): void {
    console.error(this.prefix(), ...args);
  }

  private prefix(): string {
    return `[uni]`;
  }
}

export let log: Logger = new Logger("info");

export const setGlobalLogger = (logger: Logger): void => {
  log = logger;
};
