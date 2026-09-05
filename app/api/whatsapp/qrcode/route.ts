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
    const result = await botClient.getQrCode();
    
    // result mengembalikan { qr: string | null }
    return apiSuccess({ qr: result.qr ?? null });
  } catch (error) {
    console.error("API Error [/api/whatsapp/qrcode]:", error);
    return apiError(error);
  }
}