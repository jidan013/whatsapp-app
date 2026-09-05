import { auth } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { botClient } from "@/lib/bot-client";
import { activityLogRepository } from "@/repositories/activity-log.repository";
import { UnauthorizedError } from "@/types/domain-errors";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();
    assertPermission(session, PERMISSIONS.SETTINGS_MANAGE);

    const result = await botClient.disconnect();

    if (result.success) {
      await activityLogRepository.record({
        userId: session.user.id,
        action: "UPDATE",
        entityType: "WhatsAppConnection",
        description: `${session.user.name} memutuskan koneksi WhatsApp bot secara manual`,
      });
    }

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}