import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError, NotFoundError } from "@/types/domain-errors";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const { id } = await params;
    const notification = await prisma.notification.findFirst({ where: { id, userId: session.user.id } });
    if (!notification) throw new NotFoundError("Notification", id);

    const updated = await prisma.notification.update({
      where: { id },
      data: { status: "READ", readAt: new Date() },
    });

    return apiSuccess(updated);
  } catch (error) {
    return apiError(error);
  }
}