import type { WASocket } from "@whiskeysockets/baileys";
import { prisma } from "@/lib/prisma";
import { botLogger } from "@/bot/utils/logger";

const POLL_INTERVAL_MS = 10_000;
const BATCH_SIZE = 20;

let pollHandle: ReturnType<typeof setInterval> | null = null;

async function dispatchPendingNotifications(socket: WASocket): Promise<void> {
  const pending = await prisma.notification.findMany({
    where: { channel: "WHATSAPP", status: "PENDING" },
    include: { user: true },
    take: BATCH_SIZE,
    orderBy: { createdAt: "asc" },
  });

  for (const notification of pending) {
    if (!notification.user.phoneNumber) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "FAILED", errorMessage: "User tidak memiliki nomor WhatsApp terdaftar" },
      });
      continue;
    }

    const jid = `${notification.user.phoneNumber}@s.whatsapp.net`;

    try {
      await socket.sendMessage(jid, { text: `*${notification.title}*\n\n${notification.message}` });
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    } catch (error) {
      botLogger.error({ err: error, notificationId: notification.id }, "Gagal mengirim notifikasi WhatsApp");
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Unknown error" },
      });
    }
  }
}

export function startNotificationDispatcher(socket: WASocket): void {
  if (pollHandle) {
    clearInterval(pollHandle);
  }

  pollHandle = setInterval(() => {
    void dispatchPendingNotifications(socket).catch((error: unknown) => {
      botLogger.error({ err: error }, "Notification dispatcher polling error");
    });
  }, POLL_INTERVAL_MS);

  botLogger.info({ intervalMs: POLL_INTERVAL_MS }, "Notification dispatcher aktif");
}

export function stopNotificationDispatcher(): void {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
}
