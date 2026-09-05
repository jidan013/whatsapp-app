import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import archiver from "archiver";
import { createWriteStream } from "node:fs";
import { prisma } from "@/lib/prisma";
import { googleDriveSyncService } from "@/server/google-drive/google-drive-sync.service";
import { logger } from "@/lib/logger/logger";
import type { BackupType } from "@prisma/client";

const execFileAsync = promisify(execFile);

const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backup");
const ENCRYPTION_ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error("ENCRYPTION_KEY harus berupa 32 byte hex (64 karakter). Generate dengan: openssl rand -hex 32");
  }
  return Buffer.from(keyHex, "hex");
}

function encryptBuffer(buffer: Buffer): Buffer {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: [iv(12)][authTag(16)][ciphertext]
  return Buffer.concat([iv, authTag, encrypted]);
}

export function decryptBuffer(payload: Buffer): Buffer {
  const key = getEncryptionKey();
  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

async function ensureBackupDir(): Promise<void> {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

async function dumpDatabase(outputPath: string): Promise<void> {
  const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL belum diset");
  }
  // pg_dump harus tersedia di PATH server (paket postgresql-client di Ubuntu).
  await execFileAsync("pg_dump", ["--format=custom", `--file=${outputPath}`, databaseUrl]);
}

async function zipDirectory(sourceDir: string, outputPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    void archive.finalize();
  });
}

export const backupService = {
  async runBackup(params: { type: BackupType; triggeredById?: string; isAutomatic: boolean }) {
    await ensureBackupDir();

    const backupLog = await prisma.backupLog.create({
      data: {
        type: params.type,
        status: "RUNNING",
        triggeredById: params.triggeredById,
        isAutomatic: params.isAutomatic,
        isEncrypted: process.env.BACKUP_ENCRYPT !== "false",
        startedAt: new Date(),
      },
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    try {
      let rawBuffer: Buffer;
      let baseFileName: string;

      if (params.type === "DATABASE_ONLY") {
        const dumpPath = path.join(BACKUP_DIR, `db-${timestamp}.dump`);
        await dumpDatabase(dumpPath);
        rawBuffer = await fs.readFile(dumpPath);
        baseFileName = `db-backup-${timestamp}.dump`;
        await fs.unlink(dumpPath);
      } else if (params.type === "FILES_ONLY") {
        const zipPath = path.join(BACKUP_DIR, `files-${timestamp}.zip`);
        const storageDir = process.env.STORAGE_LOCAL_PATH ?? path.join(process.cwd(), "storage", "local");
        await zipDirectory(storageDir, zipPath);
        rawBuffer = await fs.readFile(zipPath);
        baseFileName = `files-backup-${timestamp}.zip`;
        await fs.unlink(zipPath);
      } else {
        const dumpPath = path.join(BACKUP_DIR, `db-${timestamp}.dump`);
        await dumpDatabase(dumpPath);
        const zipPath = path.join(BACKUP_DIR, `full-${timestamp}.zip`);
        const storageDir = process.env.STORAGE_LOCAL_PATH ?? path.join(process.cwd(), "storage", "local");

        await new Promise<void>((resolve, reject) => {
          const output = createWriteStream(zipPath);
          const archive = archiver("zip", { zlib: { level: 9 } });
          output.on("close", () => resolve());
          archive.on("error", (err) => reject(err));
          archive.pipe(output);
          archive.file(dumpPath, { name: "database.dump" });
          archive.directory(storageDir, "files");
          void archive.finalize();
        });

        rawBuffer = await fs.readFile(zipPath);
        baseFileName = `full-backup-${timestamp}.zip`;
        await fs.unlink(dumpPath);
        await fs.unlink(zipPath);
      }

      const shouldEncrypt = process.env.BACKUP_ENCRYPT !== "false";
      const finalBuffer = shouldEncrypt ? encryptBuffer(rawBuffer) : rawBuffer;
      const finalFileName = shouldEncrypt ? `${baseFileName}.enc` : baseFileName;
      const finalPath = path.join(BACKUP_DIR, finalFileName);
      await fs.writeFile(finalPath, finalBuffer);

      const checksum = crypto.createHash("sha256").update(finalBuffer).digest("hex");

      let googleDriveFileId: string | undefined;
      try {
        const driveFile = await googleDriveSyncService.syncFile({
          fileName: finalFileName,
          mimeType: "application/octet-stream",
          buffer: finalBuffer,
          category: "BACKUP",
          userId: params.triggeredById,
        });
        googleDriveFileId = driveFile.id;
      } catch (error) {
        logger.warn({ err: error }, "Gagal sync backup ke Google Drive, file tetap tersimpan lokal");
      }

      return prisma.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: "COMPLETED",
          filePath: finalPath,
          fileSizeBytes: finalBuffer.byteLength,
          checksum,
          googleDriveFileId,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Backup gagal");
      return prisma.backupLog.update({
        where: { id: backupLog.id },
        data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Unknown error" },
      });
    }
  },

  async pruneOldBackups(): Promise<number> {
    const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS ?? 30);
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const oldBackups = await prisma.backupLog.findMany({
      where: { createdAt: { lt: cutoff }, status: "COMPLETED" },
    });

    let deletedCount = 0;
    for (const backup of oldBackups) {
      if (backup.filePath) {
        await fs.unlink(backup.filePath).catch(() => undefined);
      }
      await prisma.backupLog.delete({ where: { id: backup.id } });
      deletedCount += 1;
    }

    return deletedCount;
  },
};
