import "server-only";
import { prisma } from "@/lib/prisma";
import type { CreateDepartmentInput, UpdateDepartmentInput } from "@/lib/validation/organization.schema";

export const departmentRepository = {
  async findMany() {
    return prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: { _count: { select: { users: true, technicians: true, agenda: true } } },
    });
  },

  async findById(id: string) {
    return prisma.department.findFirst({ where: { id, deletedAt: null } });
  },

  async create(data: CreateDepartmentInput) {
    return prisma.department.create({ data });
  },

  async update(id: string, data: UpdateDepartmentInput) {
    return prisma.department.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    return prisma.department.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
