// repositories/agenda.repository.ts
import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, AgendaPriority, AgendaSourceChannel } from "@prisma/client";

export interface AgendaListFilter {
  dateFrom?: Date;
  dateTo?: Date;
  categoryId?: string;
  statusId?: string;
  technicianId?: string;
  departmentId?: string;
  assignedToId?: string;
  location?: string;
  search?: string;
  priority?: AgendaPriority;
}

export interface AgendaListParams {
  filter: AgendaListFilter;
  skip?: number;
  take?: number;
  orderBy?: "scheduledDate" | "createdAt" | "priority";
  orderDirection?: "asc" | "desc";
}

export interface CreateAgendaData {
  title: string;
  description: string;
  location?: string | null;
  scheduledDate: Date;
  scheduledTime?: string | null;
  priority: AgendaPriority;
  sourceChannel: AgendaSourceChannel;
  notes?: string | null;
  categoryId: string;
  statusId: string;
  departmentId?: string | null;
  technicianId?: string | null;
  assignedToId?: string | null;
  createdById: string;
}

export type UpdateAgendaData = Partial<Omit<CreateAgendaData, "createdById">>;

// Include untuk detail agenda (digunakan di findById, create, update, markCompleted)
const agendaDetailInclude = {
  category: true,
  status: true,
  department: true,
  technician: { include: { user: true } },
  createdBy: true,
  assignedTo: true,
  media: { where: { deletedAt: null } },
  comments: {
    where: { deletedAt: null },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.AgendaInclude;

function buildWhere(filter: AgendaListFilter): Prisma.AgendaWhereInput {
  return {
    deletedAt: null,
    ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
    ...(filter.statusId ? { statusId: filter.statusId } : {}),
    ...(filter.technicianId ? { technicianId: filter.technicianId } : {}),
    ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
    ...(filter.assignedToId ? { assignedToId: filter.assignedToId } : {}),
    ...(filter.priority ? { priority: filter.priority } : {}),
    ...(filter.location ? { location: { contains: filter.location, mode: "insensitive" } } : {}),
    ...(filter.dateFrom || filter.dateTo
      ? {
          scheduledDate: {
            ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
            ...(filter.dateTo ? { lte: filter.dateTo } : {}),
          },
        }
      : {}),
    ...(filter.search
      ? {
          OR: [
            { title: { contains: filter.search, mode: "insensitive" } },
            { description: { contains: filter.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export const agendaRepository = {
  async findMany(params: AgendaListParams) {
    const where = buildWhere(params.filter);
    const skip = params.skip ?? 0;
    const take = params.take ?? 10;
    const orderBy = { [params.orderBy ?? "scheduledDate"]: params.orderDirection ?? "desc" };

    const [items, total] = await Promise.all([
      prisma.agenda.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: true,
          status: true,
          technician: { include: { user: true } },
          assignedTo: true,
        },
      }),
      prisma.agenda.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return prisma.agenda.findFirst({
      where: { id, deletedAt: null },
      include: agendaDetailInclude, 
    });
  },

  async create(data: CreateAgendaData) {
    return prisma.agenda.create({
      data,
      include: agendaDetailInclude, 
    });
  },

  async update(id: string, data: UpdateAgendaData) {
    return prisma.agenda.update({
      where: { id },
      data,
      include: agendaDetailInclude, 
    });
  },

  async softDelete(id: string) {
    return prisma.agenda.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async markCompleted(id: string, statusId: string) {
    return prisma.agenda.update({
      where: { id },
      data: { statusId, completedAt: new Date() },
      include: agendaDetailInclude, // ✅ dipakai
    });
  },

  async countByStatus(filter: Pick<AgendaListFilter, "dateFrom" | "dateTo" | "departmentId">) {
    const where = buildWhere(filter);
    const grouped = await prisma.agenda.groupBy({
      by: ["statusId"],
      where,
      _count: { _all: true },
    });
    return grouped;
  },

  async existsWithinDay(technicianId: string, scheduledDate: Date, excludeId?: string) {
    const startOfDay = new Date(scheduledDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduledDate);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await prisma.agenda.count({
      where: {
        technicianId,
        deletedAt: null,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  },
};