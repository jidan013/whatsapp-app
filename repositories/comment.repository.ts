import "server-only";
import { prisma } from "@/lib/prisma";

export const commentRepository = {
  async create(agendaId: string, userId: string, content: string) {
    return prisma.comment.create({
      data: { agendaId, userId, content },
      include: { user: true },
    });
  },

  async findById(id: string) {
    return prisma.comment.findFirst({ where: { id, deletedAt: null } });
  },

  async softDelete(id: string) {
    return prisma.comment.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
