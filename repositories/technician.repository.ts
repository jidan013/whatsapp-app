import "server-only";
import { prisma } from "@/lib/prisma";
import type { CreateTechnicianInput, UpdateTechnicianInput } from "@/lib/validation/organization.schema";

export const technicianRepository = {
  async findMany() {
    return prisma.technician.findMany({
      where: { deletedAt: null },
      include: { user: true, department: true },
      orderBy: { user: { name: "asc" } },
    });
  },

  async findById(id: string) {
    return prisma.technician.findFirst({
      where: { id, deletedAt: null },
      include: { user: true, department: true },
    });
  },

  async findByUserId(userId: string) {
    return prisma.technician.findFirst({ where: { userId, deletedAt: null } });
  },

  async create(data: CreateTechnicianInput) {
    return prisma.technician.create({
      data,
      include: { user: true, department: true },
    });
  },

  async update(id: string, data: UpdateTechnicianInput) {
    return prisma.technician.update({
      where: { id },
      data,
      include: { user: true, department: true },
    });
  },

  async softDelete(id: string) {
    return prisma.technician.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  },
};
