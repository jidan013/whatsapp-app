import type { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { backupService } from "@/server/backup/backup.service";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { UnauthorizedError } from "@/types/domain-errors";

const triggerBackupSchema = z.object({
  type: z.enum(["FULL", "DATABASE_ONLY", "FILES_ONLY"]).default("FULL"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();
    assertPermission(session, PERMISSIONS.BACKUP_VIEW);

    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "20");

    const [items, total] = await Promise.all([
      prisma.backupLog.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.backupLog.count(),
    ]);

    return apiSuccess({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();
    assertPermission(session, PERMISSIONS.BACKUP_TRIGGER);

    const body: unknown = await request.json().catch(() => ({}));
    const { type } = triggerBackupSchema.parse(body);

    const backup = await backupService.runBackup({ type, triggeredById: session.user.id, isAutomatic: false });
    return apiSuccess(backup, 201);
  } catch (error) {
    return apiError(error);
  }
}
