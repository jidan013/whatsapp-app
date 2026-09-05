// services/agenda.service.ts
import "server-only";
import { agendaRepository, type AgendaListFilter as RepositoryAgendaListFilter } from "@/repositories/agenda.repository";
import type { CreateAgendaData } from "@/repositories/agenda.repository"; // import untuk tipe
import { activityLogRepository } from "@/repositories/activity-log.repository";
import { notificationService } from "@/services/notification.service";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { NotFoundError, ConflictError } from "@/types/domain-errors";
import { prisma } from "@/lib/prisma";
import type { CreateAgendaInput, UpdateAgendaInput, AgendaListFilter } from "@/lib/validation/agenda.schema";
import type { Session } from "next-auth";
import type { AgendaPriority, AgendaSourceChannel } from "@prisma/client";

const DEFAULT_STATUS_CODE = "PENDING";

async function resolveDefaultStatusId(): Promise<string> {
  const status = await prisma.agendaStatus.findUnique({ where: { code: DEFAULT_STATUS_CODE } });
  if (!status) {
    throw new ConflictError(
      `Status default "${DEFAULT_STATUS_CODE}" belum ada di database. Jalankan seed terlebih dahulu.`,
    );
  }
  return status.id;
}

export const agendaService = {
  async list(session: Session, filterInput: AgendaListFilter) {
    assertPermission(session, PERMISSIONS.AGENDA_READ);

    const { page, limit, ...filter } = filterInput;
    const currentPage = Math.max(1, page);
    const currentLimit = Math.max(1, limit);
    const skip = (currentPage - 1) * currentLimit;

    const dateFilter: { dateFrom?: Date; dateTo?: Date } = {};
    if (filter.tanggal) {
      const date = new Date(filter.tanggal);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      dateFilter.dateFrom = start;
      dateFilter.dateTo = end;
    }

    const repositoryFilter: RepositoryAgendaListFilter = {
      ...dateFilter,
      technicianId: filter.teknisi,
      statusId: filter.status,
      priority: filter.prioritas as AgendaPriority | undefined,
      search: filter.search,
    };

    const result = await agendaRepository.findMany({
      filter: repositoryFilter,
      skip,
      take: currentLimit,
      orderBy: "scheduledDate",
      orderDirection: "desc",
    });

    return {
      items: result.items,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total: result.total,
        totalPages: Math.ceil(result.total / currentLimit),
      },
    };
  },

  async getById(session: Session, id: string) {
    assertPermission(session, PERMISSIONS.AGENDA_READ);

    const agenda = await agendaRepository.findById(id);
    if (!agenda) {
      throw new NotFoundError("Agenda", id);
    }
    return agenda;
  },

  async create(session: Session, input: CreateAgendaInput) {
    assertPermission(session, PERMISSIONS.AGENDA_CREATE);

    if (input.technicianId) {
      const alreadyBooked = await agendaRepository.existsWithinDay(input.technicianId, input.scheduledDate);
      if (alreadyBooked) {
        throw new ConflictError("Teknisi ini sudah memiliki agenda lain pada tanggal yang sama");
      }
    }

       const statusId = input.statusId ?? (await resolveDefaultStatusId());

    const agenda = await agendaRepository.create({
      title: input.title,
      description: input.description ?? "",
      location: input.location ?? null,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime ?? null,
      priority: input.priority,
      sourceChannel: "WEB" as AgendaSourceChannel,
      notes: input.notes ?? null, 
      categoryId: input.categoryId,
      statusId,
      departmentId: input.departmentId ?? null,
      technicianId: input.technicianId ?? null,
      assignedToId: input.assignedToId ?? null,
      createdById: session.user.id,
    });

    await activityLogRepository.record({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Agenda",
      entityId: agenda.id,
      description: `Membuat agenda "${agenda.title}"`,
    });

    if (agenda.priority === "URGENT") {
      await notificationService.notifyUrgentAgenda({
        agendaId: agenda.id,
        agendaTitle: agenda.title,
        assignedToUserId: agenda.assignedToId,
      });
    }

    return agenda;
  },

  async update(session: Session, id: string, input: UpdateAgendaInput) {
    assertPermission(session, PERMISSIONS.AGENDA_UPDATE);

    const existing = await agendaRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Agenda", id);
    }

    if (input.technicianId && input.scheduledDate) {
      const alreadyBooked = await agendaRepository.existsWithinDay(input.technicianId, input.scheduledDate, id);
      if (alreadyBooked) {
        throw new ConflictError("Teknisi ini sudah memiliki agenda lain pada tanggal yang sama");
      }
    }

    // Buat object update dengan tipe yang sesuai (tanpa createdById dan sourceChannel)
    const updateData: Partial<Omit<CreateAgendaData, "createdById" | "sourceChannel">> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.scheduledDate !== undefined) updateData.scheduledDate = input.scheduledDate;
    if (input.scheduledTime !== undefined) updateData.scheduledTime = input.scheduledTime;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
    if (input.statusId !== undefined) updateData.statusId = input.statusId;
    if (input.departmentId !== undefined) updateData.departmentId = input.departmentId;
    if (input.technicianId !== undefined) updateData.technicianId = input.technicianId;
    if (input.assignedToId !== undefined) updateData.assignedToId = input.assignedToId;

    const updated = await agendaRepository.update(id, updateData);

    await activityLogRepository.record({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Agenda",
      entityId: id,
      description: `Memperbarui agenda "${updated.title}"`,
    });

    return updated;
  },

  async markCompleted(session: Session, id: string) {
    assertPermission(session, PERMISSIONS.AGENDA_UPDATE);

    const existing = await agendaRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Agenda", id);
    }

    const completedStatus = await prisma.agendaStatus.findUnique({ where: { code: "COMPLETED" } });
    if (!completedStatus) {
      throw new ConflictError('Status "COMPLETED" belum ada di database. Jalankan seed terlebih dahulu.');
    }

    const updated = await agendaRepository.markCompleted(id, completedStatus.id);

    await activityLogRepository.record({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Agenda",
      entityId: id,
      description: `Menandai agenda "${updated.title}" sebagai selesai`,
    });

    return updated;
  },

  async remove(session: Session, id: string) {
    assertPermission(session, PERMISSIONS.AGENDA_DELETE);

    const existing = await agendaRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Agenda", id);
    }

    await agendaRepository.softDelete(id);

    await activityLogRepository.record({
      userId: session.user.id,
      action: "DELETE",
      entityType: "Agenda",
      entityId: id,
      description: `Menghapus agenda "${existing.title}"`,
    });
  },

  async getFilterOptions(session: Session) {
    assertPermission(session, PERMISSIONS.AGENDA_READ);

    const [technicians, statuses] = await Promise.all([
      prisma.technician.findMany({
        where: { isActive: true, deletedAt: null },
        include: { user: true },
        orderBy: { user: { name: "asc" } },
      }),
      prisma.agendaStatus.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    const priorities = [
      { id: "LOW", name: "Rendah" },
      { id: "MEDIUM", name: "Sedang" },
      { id: "HIGH", name: "Tinggi" },
      { id: "URGENT", name: "Urgent" },
    ];

    return {
      technicians: technicians.map((t) => ({ id: t.id, name: t.user.name })),
      statuses: statuses.map((s) => ({ id: s.id, name: s.name })),
      priorities,
    };
  },
};