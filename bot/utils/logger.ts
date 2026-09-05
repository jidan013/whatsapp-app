import pino from "pino";

export const botLogger = pino({
  level: process.env.BOT_LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" } }
      : undefined,
  base: { app: "whatsapp-bot" },
  timestamp: pino.stdTimeFunctions.isoTime,
});
