import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import mime from "mime-types";
import { prisma } from "@/lib/prisma";
import { botLogger } from "@/bot/utils/logger";
import type { LaporFlowData } from "@/bot/session/session-store";
import type { Agenda, MediaType } from "@prisma/client";

export async function listActiveCategories() {
  return prisma.agendaCategory.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function findCategoryByIndex(index: number) {
  const categories = await listActiveCategories();
  return categories[index] ?? null;
}

async function attachMediaToAgenda(
  agendaId: string,
  uploadedById: string,
  localPaths: string[] | undefined,
  mediaType: MediaType,
): Promise<void> {
  if (!localPaths || localPaths.length === 0) return;

  for (const localPath of localPaths) {
    try {
      const buffer = await fs.readFile(localPath);
      const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
      const fileName = path.basename(localPath);
      const mimeType = mime.lookup(fileName) || "application/octet-stream";

      await prisma.agendaMedia.create({
        data: {
          agendaId,
          type: mediaType,
          fileName,
          originalName: fileName,
          mimeType,
          sizeBytes: buffer.byteLength,
          checksum,
          localPath,
          uploadedById,
        },
      });
    } catch (error) {
      // File individual gagal dibaca/disimpan sebagai record tidak boleh menggagalkan
      // seluruh pembuatan agenda - laporan tetap tersimpan, media yang gagal dicatat di log.
      botLogger.error({ err: error, agendaId, localPath }, "Gagal melampirkan media WhatsApp ke agenda");
    }
  }
}

export async function createAgendaFromWhatsApp(params: {
  data: LaporFlowData;
  createdByUserId: string;
}): Promise<Agenda> {
  const { data, createdByUserId } = params;

  if (!data.categoryId || !data.scheduledDate || !data.description || !data.priority) {
    throw new Error("Data laporan tidak lengkap, tidak bisa disimpan");
  }

  const defaultStatus = await prisma.agendaStatus.findUniqueOrThrow({ where: { code: "PENDING" } });

  const agenda = await prisma.agenda.create({
    data: {
      title: data.description.slice(0, 80),
      description: data.description,
      location: data.location ?? null,
      scheduledDate: new Date(data.scheduledDate),
      scheduledTime: data.scheduledTime ?? null,
      priority: data.priority,
      sourceChannel: "WHATSAPP",
      notes: data.notes ?? null,
      categoryId: data.categoryId,
      statusId: defaultStatus.id,
      createdById: createdByUserId,
    },
  });

  // Media yang dikumpulkan selama flow (bot/flows/lapor.flow.ts -> handleLaporMedia)
  // baru disimpan sebagai path lokal di session data - lampirkan sebagai AgendaMedia
  // sekarang setelah Agenda-nya benar-benar ada (butuh agendaId).
  await attachMediaToAgenda(agenda.id, createdByUserId, data.photoPaths, "IMAGE");
  await attachMediaToAgenda(agenda.id, createdByUserId, data.videoPaths, "VIDEO");
  await attachMediaToAgenda(agenda.id, createdByUserId, data.documentPaths, "DOCUMENT");

  return agenda;
}

export async function findUserByWhatsAppNumber(phoneNumber: string) {
  return prisma.user.findFirst({
    where: { phoneNumber, isActive: true, deletedAt: null },
  });
}
