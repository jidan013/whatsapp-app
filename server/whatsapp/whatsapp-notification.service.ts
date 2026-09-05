import "server-only";
import { prisma } from "@/lib/prisma";

export interface QueueWhatsAppNotificationInput {
  userId: string;
  agendaId?: string;
  title: string;
  message: string;
}

/**
 * Web process (Next.js) tidak memegang koneksi socket WhatsApp secara langsung -
 * itu dipegang oleh proses bot terpisah (lihat bot/connection.ts, dijalankan
 * sebagai proses PM2 kedua). Untuk mengirim notifikasi WhatsApp dari halaman/
 * Server Action di web, kita queue dulu ke tabel `notifications`, lalu proses
 * bot yang polling & mengirim (lihat bot/handlers/notification-dispatcher.ts).
 */
export const whatsappNotificationService = {
  async queue(input: QueueWhatsAppNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        agendaId: input.agendaId,
        channel: "WHATSAPP",
        title: input.title,
        message: input.message,
        status: "PENDING",
      },
    });
  },

  async queueMany(inputs: QueueWhatsAppNotificationInput[]) {
    return prisma.notification.createMany({
      data: inputs.map((input) => ({
        userId: input.userId,
        agendaId: input.agendaId,
        channel: "WHATSAPP" as const,
        title: input.title,
        message: input.message,
        status: "PENDING" as const,
      })),
    });
  },
};
