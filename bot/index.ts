import { connectWhatsApp, gracefulShutdown } from "@/bot/connection";
import { startHealthcheckServer, setBotConnected } from "@/bot/utils/healthcheck-server";
import { startBackupScheduler } from "@/bot/scheduler";
import { startNotificationDispatcher, stopNotificationDispatcher } from "@/bot/handlers/notification-dispatcher";
import { botLogger } from "@/bot/utils/logger";
import { prisma } from "@/lib/prisma";

async function main(): Promise<void> {
  botLogger.info("Memulai WhatsApp bot...");

  await prisma.$connect();
  botLogger.info("Koneksi database berhasil");

  const healthcheckServer = startHealthcheckServer();
  startBackupScheduler();
  const socket = await connectWhatsApp();

  socket.ev.on("connection.update", (update) => {
    if (update.connection === "open") {
      setBotConnected(true);
      startNotificationDispatcher(socket);
    }
    if (update.connection === "close") setBotConnected(false);
  });

  const shutdown = async (signal: string): Promise<void> => {
    botLogger.info({ signal }, "Menerima sinyal shutdown");
    stopNotificationDispatcher();
    await gracefulShutdown();
    healthcheckServer.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("uncaughtException", (error) => {
    botLogger.error({ err: error }, "Uncaught exception di bot process");
  });
  process.on("unhandledRejection", (reason) => {
    botLogger.error({ err: reason }, "Unhandled rejection di bot process");
  });
}

main().catch((error: unknown) => {
  botLogger.error({ err: error }, "Bot gagal memulai");
  process.exit(1);
});
