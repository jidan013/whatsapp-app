import { prisma } from "@/lib/prisma";
import type { ActivityAction, Prisma } from "@prisma/client";

export interface RecordActivityInput {
  userId?: string | null;
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export const activityLogRepository = {
  async record(input: RecordActivityInput): Promise<void> {
    await prisma.activityLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        metadata: input.metadata,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  },

  async findMany(params: { skip: number; take: number; userId?: string; action?: ActivityAction }) {
    const where: Prisma.ActivityLogWhereInput = {
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.action ? { action: params.action } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { items, total };
  },
};
