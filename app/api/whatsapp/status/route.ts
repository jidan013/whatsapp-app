import { auth } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { botClient } from "@/lib/bot-client";
import { UnauthorizedError } from "@/types/domain-errors";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();
    assertPermission(session, PERMISSIONS.SETTINGS_MANAGE);

    const status = await botClient.getStatus();
    return apiSuccess(status);
  } catch (error) {
    return apiError(error);
  }
}