import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "@/types/domain-errors";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const result = await prisma.notification.updateMany({
      where: { userId: session.user.id, status: { not: "READ" } },
      data: { status: "READ", readAt: new Date() },
    });

    return apiSuccess({ updated: result.count });
  } catch (error) {
    return apiError(error);
  }
}