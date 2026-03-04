/**
 * Cubis Foundry MCP Server – utilities / structured logger.
 *
 * ALL log output goes to stderr so stdio transport stays clean.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel =
  (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || "info";
if (!LEVEL_ORDER[currentLevel]) {
  currentLevel = "info";
}

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel];
}

function ts(): string {
  return new Date().toISOString();
}

export const logger = {
  debug(msg: string, data?: unknown): void {
    if (shouldLog("debug")) {
      process.stderr.write(
        `[${ts()}] DEBUG ${msg}${data ? ` ${JSON.stringify(data)}` : ""}\n`,
      );
    }
  },
  info(msg: string, data?: unknown): void {
    if (shouldLog("info")) {
      process.stderr.write(
        `[${ts()}] INFO  ${msg}${data ? ` ${JSON.stringify(data)}` : ""}\n`,
      );
    }
  },
  warn(msg: string, data?: unknown): void {
    if (shouldLog("warn")) {
      process.stderr.write(
        `[${ts()}] WARN  ${msg}${data ? ` ${JSON.stringify(data)}` : ""}\n`,
      );
    }
  },
  error(msg: string, data?: unknown): void {
    if (shouldLog("error")) {
      process.stderr.write(
        `[${ts()}] ERROR ${msg}${data ? ` ${JSON.stringify(data)}` : ""}\n`,
      );
    }
  },
  /** Raw line to stderr (no timestamp/level prefix). Used for startup banners. */
  raw(msg: string): void {
    process.stderr.write(`${msg}\n`);
  },
};
