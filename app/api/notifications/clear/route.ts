import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "@/types/domain-errors";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

// Audit trail keamanan yang TIDAK dihapus saat Clear History.
// Sisanya (CREATE/UPDATE/DELETE agenda, export, backup, dll.) dianggap
// riwayat operasional yang boleh dibersihkan user.
const SECURITY_ACTIONS = ["LOGIN", "LOGOUT", "PERMISSION_DENIED"] as const;

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    // 1. Hapus semua notifikasi user
    const notifications = await prisma.notification.deleteMany({
      where: { userId: session.user.id },
    });

    // 2. Hapus activity log user, kecuali log keamanan
    const activities = await prisma.activityLog.deleteMany({
      where: {
        userId: session.user.id,
        action: { notIn: [...SECURITY_ACTIONS] },
      },
    });

    return apiSuccess({
      deletedNotifications: notifications.count,
      deletedActivities: activities.count,
    });
  } catch (error) {
    return apiError(error);
  }
}