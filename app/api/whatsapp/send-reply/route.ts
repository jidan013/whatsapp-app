import type { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError, ValidationError, NotFoundError } from "@/types/domain-errors";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

const sendReplySchema = z.object({
  notificationId: z.string().min(1),
  message: z.string().min(1, "Pesan tidak boleh kosong").max(1000),
});

/**
 * Cara kerja: endpoint ini TIDAK mengirim WhatsApp secara langsung (proses
 * bot berjalan terpisah dan tidak menerima perintah kirim dari sini).
 * Sebagai gantinya, endpoint ini insert row `Notification` baru dengan
 * status PENDING. Bot's `notification-dispatcher.ts` yang sudah berjalan
 * akan mengambil (polling tiap 10 detik) dan mengirimkannya lewat socket
 * Baileys, lalu update status jadi SENT/FAILED - persis seperti alur
 * notifikasi sistem lain yang sudah ada.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const body: unknown = await request.json();
    const input = sendReplySchema.parse(body);

    const original = await prisma.notification.findUnique({
      where: { id: input.notificationId },
    });
    if (!original) throw new NotFoundError("Notification", input.notificationId);

    if (!original.agendaId) {
      throw new ValidationError("Notifikasi ini tidak terkait agenda manapun, tidak bisa menentukan tujuan balasan", {
        notificationId: ["Tidak ada agenda terkait"],
      });
    }

    const agenda = await prisma.agenda.findUnique({
      where: { id: original.agendaId },
      include: { technician: { include: { user: true } } },
    });

    if (!agenda?.technician?.user) {
      throw new ValidationError("Agenda terkait belum memiliki teknisi yang ditugaskan", {
        agendaId: ["Belum ada teknisi"],
      });
    }

    if (!agenda.technician.user.phoneNumber) {
      throw new ValidationError("Teknisi terkait tidak memiliki nomor WhatsApp terdaftar", {
        phoneNumber: ["Nomor tidak tersedia"],
      });
    }

    const reply = await prisma.notification.create({
      data: {
        userId: agenda.technician.user.id,
        agendaId: agenda.id,
        channel: "WHATSAPP",
        status: "PENDING",
        title: `Balasan dari ${session.user.name}`,
        message: input.message,
      },
    });

    return apiSuccess({
      id: reply.id,
      status: reply.status,
      note: "Pesan akan dikirim oleh bot dalam beberapa detik (proses pengiriman berjalan di background).",
    });
  } catch (error) {
    return apiError(error);
  }
}