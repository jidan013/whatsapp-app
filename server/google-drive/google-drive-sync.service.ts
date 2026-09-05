import { prisma } from "@/lib/prisma";
import { googleDriveClient } from "@/server/google-drive/google-drive-client";
import { activityLogRepository } from "@/repositories/activity-log.repository";
import type { GoogleDriveFileCategory } from "@prisma/client";

export interface SyncFileToDriveInput {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  category: GoogleDriveFileCategory;
  userId?: string;
}

export const googleDriveSyncService = {
  async syncFile(input: SyncFileToDriveInput) {
    const uploadResult = await googleDriveClient.upload({
      fileName: input.fileName,
      mimeType: input.mimeType,
      buffer: input.buffer,
    });

    const record = await prisma.googleDriveFile.create({
      data: {
        driveFileId: uploadResult.driveFileId,
        driveUrl: uploadResult.driveUrl,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: uploadResult.sizeBytes,
        checksum: uploadResult.checksum,
        category: input.category,
        driveCreatedTime: uploadResult.driveCreatedTime,
      },
    });

    await activityLogRepository.record({
      userId: input.userId ?? null,
      action: "GOOGLE_DRIVE_SYNC",
      entityType: "GoogleDriveFile",
      entityId: record.id,
      description: `Sinkronisasi file "${input.fileName}" ke Google Drive`,
    });

    return record;
  },

  async removeFile(googleDriveFileId: string, userId?: string): Promise<void> {
    const record = await prisma.googleDriveFile.findUniqueOrThrow({ where: { id: googleDriveFileId } });
    await googleDriveClient.delete(record.driveFileId);
    await prisma.googleDriveFile.update({ where: { id: googleDriveFileId }, data: { deletedAt: new Date() } });

    await activityLogRepository.record({
      userId: userId ?? null,
      action: "GOOGLE_DRIVE_SYNC",
      entityType: "GoogleDriveFile",
      entityId: googleDriveFileId,
      description: `Menghapus file "${record.fileName}" dari Google Drive`,
    });
  },
};
