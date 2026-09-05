import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";

function createLogger() {
  return pino({
    level: process.env.LOG_LEVEL ?? "info",
    transport: isDevelopment
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" },
        }
      : undefined,
    base: { app: "whatsapp-agenda-system" },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

const globalForLogger = globalThis as unknown as { logger?: pino.Logger };

export const logger = globalForLogger.logger ?? createLogger();

if (isDevelopment) {
  globalForLogger.logger = logger;
}