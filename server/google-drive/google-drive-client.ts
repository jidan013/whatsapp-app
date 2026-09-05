import { google } from "googleapis";
import { Readable } from "node:stream";
import crypto from "node:crypto";
import { logger } from "@/lib/logger/logger";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !privateKeyRaw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY belum diset di .env");
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

function getDriveClient() {
  return google.drive({ version: "v3", auth: getAuth() });
}

export interface UploadToDriveInput {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  parentFolderId?: string;
}

export interface UploadToDriveResult {
  driveFileId: string;
  driveUrl: string;
  checksum: string;
  sizeBytes: number;
  driveCreatedTime: Date;
}

export const googleDriveClient = {
  async upload(input: UploadToDriveInput): Promise<UploadToDriveResult> {
    const drive = getDriveClient();
    const parentFolderId = input.parentFolderId ?? process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    const response = await drive.files.create({
      requestBody: {
        name: input.fileName,
        parents: parentFolderId ? [parentFolderId] : undefined,
      },
      media: {
        mimeType: input.mimeType,
        body: Readable.from(input.buffer),
      },
      fields: "id, webViewLink, createdTime, size",
    });

    const fileId = response.data.id;
    if (!fileId) {
      throw new Error("Google Drive tidak mengembalikan file ID setelah upload");
    }

    const checksum = crypto.createHash("sha256").update(input.buffer).digest("hex");

    return {
      driveFileId: fileId,
      driveUrl: response.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`,
      checksum,
      sizeBytes: input.buffer.byteLength,
      driveCreatedTime: response.data.createdTime ? new Date(response.data.createdTime) : new Date(),
    };
  },

  async createFolder(name: string, parentFolderId?: string): Promise<string> {
    const drive = getDriveClient();
    const resolvedParent = parentFolderId ?? process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    const response = await drive.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: resolvedParent ? [resolvedParent] : undefined,
      },
      fields: "id",
    });

    const folderId = response.data.id;
    if (!folderId) {
      throw new Error("Google Drive tidak mengembalikan folder ID");
    }
    return folderId;
  },

  async delete(driveFileId: string): Promise<void> {
    const drive = getDriveClient();
    try {
      await drive.files.delete({ fileId: driveFileId });
    } catch (error) {
      logger.warn({ err: error, driveFileId }, "Gagal menghapus file di Google Drive (mungkin sudah terhapus)");
    }
  },

  async download(driveFileId: string): Promise<Buffer> {
    const drive = getDriveClient();
    const response = await drive.files.get({ fileId: driveFileId, alt: "media" }, { responseType: "arraybuffer" });
    return Buffer.from(response.data as ArrayBuffer);
  },
};
