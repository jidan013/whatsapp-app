import "server-only";
import { prisma } from "@/lib/prisma";
import { storageDriver } from "@/lib/storage/local-storage-driver";
import { googleDriveSyncService } from "@/server/google-drive/google-drive-sync.service";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { activityLogRepository } from "@/repositories/activity-log.repository";
import { ValidationError, NotFoundError } from "@/types/domain-errors";
import { logger } from "@/lib/logger/logger";
import type { MediaType } from "@prisma/client";
import type { Session } from "next-auth";

const ALLOWED_MIME_TYPES = (
  process.env.ALLOWED_UPLOAD_MIME_TYPES ??
  "image/jpeg,image/png,image/webp,video/mp4,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
).split(",");

const MAX_UPLOAD_SIZE_BYTES = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 50) * 1024 * 1024;

function resolveMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

export const mediaService = {
  async uploadToAgenda(session: Session, agendaId: string, file: { name: string; type: string; buffer: Buffer }) {
    assertPermission(session, PERMISSIONS.MEDIA_UPLOAD);

    const agenda = await prisma.agenda.findFirst({ where: { id: agendaId, deletedAt: null } });
    if (!agenda) {
      throw new NotFoundError("Agenda", agendaId);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new ValidationError(`Tipe file "${file.type}" tidak diizinkan`, { file: [`Tipe file tidak diizinkan`] });
    }

    if (file.buffer.byteLength > MAX_UPLOAD_SIZE_BYTES) {
      throw new ValidationError("Ukuran file melebihi batas maksimum", { file: ["Ukuran file terlalu besar"] });
    }

    const stored = await storageDriver.save(file.name, file.buffer);

    let googleDriveFileId: string | undefined;
    try {
      const driveFile = await googleDriveSyncService.syncFile({
        fileName: file.name,
        mimeType: file.type,
        buffer: file.buffer,
        category: "AGENDA_MEDIA",
        userId: session.user.id,
      });
      googleDriveFileId = driveFile.id;
    } catch (error) {
      logger.warn({ err: error }, "Gagal sync media ke Google Drive, file tetap tersimpan lokal");
    }

    const media = await prisma.agendaMedia.create({
      data: {
        agendaId,
        type: resolveMediaType(file.type),
        fileName: stored.fileName,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: stored.sizeBytes,
        checksum: stored.checksum,
        localPath: stored.localPath,
        googleDriveFileId,
        uploadedById: session.user.id,
      },
    });

    await activityLogRepository.record({
      userId: session.user.id,
      action: "UPLOAD",
      entityType: "AgendaMedia",
      entityId: media.id,
      description: `Mengunggah media "${file.name}" ke agenda`,
    });

    return media;
  },

  async remove(session: Session, mediaId: string) {
    assertPermission(session, PERMISSIONS.MEDIA_DELETE);

    const media = await prisma.agendaMedia.findFirst({ where: { id: mediaId, deletedAt: null } });
    if (!media) {
      throw new NotFoundError("AgendaMedia", mediaId);
    }

    await prisma.agendaMedia.update({ where: { id: mediaId }, data: { deletedAt: new Date() } });
    await storageDriver.delete(media.fileName);

    await activityLogRepository.record({
      userId: session.user.id,
      action: "DELETE",
      entityType: "AgendaMedia",
      entityId: mediaId,
      description: `Menghapus media "${media.originalName}"`,
    });
  },
};
