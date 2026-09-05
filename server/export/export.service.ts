import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { generateAgendaExcel } from "@/server/export/excel-generator";
import { generateAgendaCsv } from "@/server/export/csv-generator";
import { generateAgendaPdf } from "@/server/export/pdf-generator";
import { googleDriveSyncService } from "@/server/google-drive/google-drive-sync.service";
import { activityLogRepository } from "@/repositories/activity-log.repository";
import { logger } from "@/lib/logger/logger";
import type { AgendaListFilterInput } from "@/lib/validation/agenda.schema";
import type { ExportFormat, Prisma, Agenda, AgendaCategory, AgendaStatus, Technician, User } from "@prisma/client";
import type { Session } from "next-auth";
import type { AgendaPriority } from "@prisma/client";

// Definisikan tipe untuk row yang lengkap dengan relasi
type AgendaWithRelations = Agenda & {
  category: AgendaCategory;
  status: AgendaStatus;
  technician: (Technician & { user: User }) | null;
};

const EXPORT_DIR = process.env.EXPORT_DIR ?? path.join(process.cwd(), "exports");

const MIME_TYPE_BY_FORMAT: Record<ExportFormat, string> = {
  PDF: "application/pdf",
  EXCEL: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  CSV: "text/csv",
};

const EXTENSION_BY_FORMAT: Record<ExportFormat, string> = {
  PDF: "pdf",
  EXCEL: "xlsx",
  CSV: "csv",
};

/**
 * Generate buffer file berdasarkan format export
 */
async function generateExportBuffer(
  exportFormat: ExportFormat,
  rows: AgendaWithRelations[]
): Promise<Buffer> {
  switch (exportFormat) {
    case "PDF":
      return generateAgendaPdf(rows);
    case "EXCEL":
      return generateAgendaExcel(rows);
    case "CSV":
      return generateAgendaCsv(rows);
    default:
      throw new Error(`Format export tidak didukung: ${exportFormat}`);
  }
}

/**
 * Mendapatkan MIME type berdasarkan format
 */
function getMimeType(exportFormat: ExportFormat): string {
  return MIME_TYPE_BY_FORMAT[exportFormat];
}

/**
 * Mendapatkan ekstensi file berdasarkan format
 */
function getFileExtension(exportFormat: ExportFormat): string {
  return EXTENSION_BY_FORMAT[exportFormat];
}

/**
 * Memastikan direktori export tersedia
 */
async function ensureExportDir(): Promise<void> {
  await fs.mkdir(EXPORT_DIR, { recursive: true });
}

/**
 * Konversi filter input ke repository filter
 */
function mapFilterInputToRepositoryFilter(
  filter: Partial<AgendaListFilterInput>
): {
  dateFrom?: Date;
  dateTo?: Date;
  technicianId?: string;
  statusId?: string;
  priority?: AgendaPriority;
  search?: string;
} {
  const result: {
    dateFrom?: Date;
    dateTo?: Date;
    technicianId?: string;
    statusId?: string;
    priority?: AgendaPriority;
    search?: string;
  } = {};

  if (filter.tanggal) {
    const date = new Date(filter.tanggal);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    result.dateFrom = start;
    result.dateTo = end;
  }

  if (filter.teknisi) {
    result.technicianId = filter.teknisi;
  }

  if (filter.status) {
    result.statusId = filter.status;
  }

  if (filter.prioritas) {
    result.priority = filter.prioritas as AgendaPriority;
  }

  if (filter.search) {
    result.search = filter.search;
  }

  return result;
}

/**
 * Membangun where clause untuk Prisma
 */
function buildAgendaWhere(
  filter: {
    dateFrom?: Date;
    dateTo?: Date;
    technicianId?: string;
    statusId?: string;
    priority?: AgendaPriority;
    search?: string;
  }
): Prisma.AgendaWhereInput {
  const where: Prisma.AgendaWhereInput = {
    deletedAt: null,
  };

  if (filter.technicianId) {
    where.technicianId = filter.technicianId;
  }

  if (filter.statusId) {
    where.statusId = filter.statusId;
  }

  if (filter.priority) {
    where.priority = filter.priority;
  }

  if (filter.dateFrom || filter.dateTo) {
    where.scheduledDate = {};
    if (filter.dateFrom) where.scheduledDate.gte = filter.dateFrom;
    if (filter.dateTo) where.scheduledDate.lte = filter.dateTo;
  }

  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { description: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export const exportService = {
  /**
   * Membuat export baru
   */
  async createExport(
    session: Session,
    exportFormat: ExportFormat,
    filter: Partial<AgendaListFilterInput>
  ) {
    assertPermission(session, PERMISSIONS.AGENDA_EXPORT);
    await ensureExportDir();

    const exportRecord = await prisma.export.create({
      data: {
        requestedById: session.user.id,
        format: exportFormat,
        status: "PROCESSING",
        filters: filter as Prisma.InputJsonValue,
        startedAt: new Date(),
      },
    });

    try {
      const repositoryFilter = mapFilterInputToRepositoryFilter(filter);
      const where = buildAgendaWhere(repositoryFilter);

      const rows = await prisma.agenda.findMany({
        where,
        include: {
          category: true,
          status: true,
          technician: { include: { user: true } },
        },
        orderBy: { scheduledDate: "desc" },
      });

      // rows sudah memiliki tipe yang benar dari Prisma (dengan include)
      const buffer = await generateExportBuffer(exportFormat, rows as AgendaWithRelations[]);

      const fileName = `agenda-export-${randomUUID()}.${getFileExtension(exportFormat)}`;
      const filePath = path.join(EXPORT_DIR, fileName);
      await fs.writeFile(filePath, buffer);

      let googleDriveFileId: string | undefined;
      try {
        const driveFile = await googleDriveSyncService.syncFile({
          fileName,
          mimeType: getMimeType(exportFormat),
          buffer,
          category: "EXPORT",
          userId: session.user.id,
        });
        googleDriveFileId = driveFile.id;
      } catch (error) {
        logger.warn(
          { err: error },
          "Gagal sync export ke Google Drive, file tetap tersimpan lokal"
        );
      }

      const updated = await prisma.export.update({
        where: { id: exportRecord.id },
        data: {
          status: "COMPLETED",
          filePath,
          googleDriveFileId,
          completedAt: new Date(),
        },
      });

      await activityLogRepository.record({
        userId: session.user.id,
        action: "EXPORT",
        entityType: "Export",
        entityId: exportRecord.id,
        description: `Export agenda format ${exportFormat} (${rows.length} data)`,
      });

      return updated;
    } catch (error) {
      await prisma.export.update({
        where: { id: exportRecord.id },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });
      throw error;
    }
  },

  /**
   * Mendapatkan daftar export dengan paginasi
   */
  async listExports(
    session: Session,
    params: { skip: number; take: number }
  ) {
    assertPermission(session, PERMISSIONS.AGENDA_EXPORT);

    const [items, total] = await Promise.all([
      prisma.export.findMany({
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
        include: {
          requestedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.export.count(),
    ]);

    return { items, total };
  },

  /**
   * Mendapatkan detail export berdasarkan ID
   */
  async getExportById(session: Session, id: string) {
    assertPermission(session, PERMISSIONS.AGENDA_EXPORT);

    const exportRecord = await prisma.export.findUnique({
      where: { id },
      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!exportRecord) {
      throw new Error("Export tidak ditemukan");
    }

    return exportRecord;
  },

  /**
   * Download file export
   */
  async downloadExport(session: Session, id: string) {
    assertPermission(session, PERMISSIONS.AGENDA_EXPORT);

    const exportRecord = await this.getExportById(session, id);

    if (exportRecord.status !== "COMPLETED") {
      throw new Error("Export belum selesai diproses");
    }

    if (!exportRecord.filePath) {
      throw new Error("File export tidak ditemukan");
    }

    const buffer = await fs.readFile(exportRecord.filePath);
    const mimeType = getMimeType(exportRecord.format);
    const extension = getFileExtension(exportRecord.format);
    const fileName = `agenda-export.${extension}`;

    return { buffer, mimeType, fileName };
  },

  /**
   * Hapus export (soft delete)
   */
  async deleteExport(session: Session, id: string) {
    assertPermission(session, PERMISSIONS.AGENDA_EXPORT);

    const exportRecord = await this.getExportById(session, id);

    if (exportRecord.filePath) {
      try {
        await fs.unlink(exportRecord.filePath);
      } catch (error) {
        logger.warn({ err: error, filePath: exportRecord.filePath }, "Gagal menghapus file export");
      }
    }

    await prisma.export.delete({
      where: { id },
    });

    await activityLogRepository.record({
      userId: session.user.id,
      action: "DELETE",
      entityType: "Export",
      entityId: id,
      description: `Menghapus export ${exportRecord.format}`,
    });
  },
};