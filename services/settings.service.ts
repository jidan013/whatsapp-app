import "server-only";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { activityLogRepository } from "@/repositories/activity-log.repository";
import type { Prisma, Setting } from "@prisma/client";
import type { Session } from "next-auth";

export const settingsService = {
  async list(category?: string): Promise<Setting[]> {
    return prisma.setting.findMany({
      where: category ? { category } : undefined,
      orderBy: { key: "asc" },
    });
  },

  async get(key: string) {
    return prisma.setting.findUnique({ where: { key } });
  },

  async set(session: Session, key: string, value: Prisma.InputJsonValue, category = "general") {
    assertPermission(session, PERMISSIONS.SETTINGS_MANAGE);

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value, category },
      create: { key, value, category },
    });

    await activityLogRepository.record({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Setting",
      entityId: setting.id,
      description: `Memperbarui setting "${key}"`,
    });

    return setting;
  },
};
