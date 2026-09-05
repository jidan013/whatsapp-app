import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export interface StoredFile {
  fileName: string;
  localPath: string;
  sizeBytes: number;
  checksum: string;
}

export interface StorageDriver {
  save(originalName: string, buffer: Buffer): Promise<StoredFile>;
  delete(fileName: string): Promise<void>;
  read(fileName: string): Promise<Buffer>;
}

const STORAGE_DIR = process.env.STORAGE_LOCAL_PATH ?? path.join(process.cwd(), "storage", "local");

function sanitizeExtension(originalName: string): string {
  const ext = path.extname(originalName);
  // Hanya izinkan karakter alfanumerik pada ekstensi untuk mencegah path traversal.
  return /^\.[a-zA-Z0-9]{1,10}$/.test(ext) ? ext : "";
}

class LocalStorageDriver implements StorageDriver {
  private async ensureDir(): Promise<void> {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }

  async save(originalName: string, buffer: Buffer): Promise<StoredFile> {
    await this.ensureDir();

    const extension = sanitizeExtension(originalName);
    const fileName = `${crypto.randomUUID()}${extension}`;
    const localPath = path.join(STORAGE_DIR, fileName);

    await fs.writeFile(localPath, buffer);
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    return { fileName, localPath, sizeBytes: buffer.byteLength, checksum };
  }

  async delete(fileName: string): Promise<void> {
    const safePath = path.join(STORAGE_DIR, path.basename(fileName));
    await fs.unlink(safePath).catch(() => undefined);
  }

  async read(fileName: string): Promise<Buffer> {
    const safePath = path.join(STORAGE_DIR, path.basename(fileName));
    return fs.readFile(safePath);
  }
}

/**
 * STORAGE_DRIVER env var menentukan implementasi. Saat ini hanya 'local' yang
 * diimplementasikan (sesuai requirement default). Untuk pindah ke S3/MinIO,
 * buat class baru yang implement StorageDriver di file terpisah (mis.
 * s3-storage-driver.ts) lalu tukar di sini berdasarkan STORAGE_DRIVER.
 */
export const storageDriver: StorageDriver = new LocalStorageDriver();
