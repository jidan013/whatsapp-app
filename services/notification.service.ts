import "server-only";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/server/email/email.service";
import { whatsappNotificationService } from "@/server/whatsapp/whatsapp-notification.service";
import { FEATURES_CONFIG } from "@/config/features.config";

export interface NotifyUserInput {
  userId: string;
  agendaId?: string;
  title: string;
  message: string;
}

export const notificationService = {
  /**
   * Mengirim satu notifikasi logis ke seluruh channel yang relevan untuk user
   * tersebut: selalu dicatat sebagai notifikasi WEB (muncul di halaman
   * Notifications), dikirim email jika EMAIL_ENABLED dan user punya email, dan
   * di-queue ke WhatsApp jika user punya nomor telepon terdaftar.
   */
  async notifyUser(input: NotifyUserInput): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) return;

    await prisma.notification.create({
      data: {
        userId: input.userId,
        agendaId: input.agendaId,
        channel: "WEB",
        title: input.title,
        message: input.message,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    if (user.phoneNumber) {
      await whatsappNotificationService.queue({
        userId: input.userId,
        agendaId: input.agendaId,
        title: input.title,
        message: input.message,
      });
    }

    if (FEATURES_CONFIG.emailNotificationEnabled) {
      await emailService.send({
        to: user.email,
        subject: input.title,
        text: input.message,
      });
    }
  },

  async notifyUrgentAgenda(params: { agendaId: string; agendaTitle: string; assignedToUserId: string | null }): Promise<void> {
    if (!params.assignedToUserId) return;

    await notificationService.notifyUser({
      userId: params.assignedToUserId,
      agendaId: params.agendaId,
      title: "Agenda Urgent Baru",
      message: `Anda mendapat agenda dengan prioritas URGENT: "${params.agendaTitle}". Segera tindak lanjuti.`,
    });
  },
};
