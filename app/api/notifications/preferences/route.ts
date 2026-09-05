import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "@/types/domain-errors";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

const preferencesSchema = z.object({
  push: z.boolean(),
  whatsapp: z.boolean(),
  emailDigest: z.boolean(),
});

function keyFor(userId: string) {
  return `notification-preference:${userId}`;
}

const DEFAULT_PREFERENCES = { push: true, whatsapp: true, emailDigest: false };

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const setting = await prisma.setting.findUnique({ where: { key: keyFor(session.user.id) } });
    return apiSuccess(setting?.value ?? DEFAULT_PREFERENCES);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const body: unknown = await request.json();
    const prefs = preferencesSchema.parse(body);

    const setting = await prisma.setting.upsert({
      where: { key: keyFor(session.user.id) },
      update: { value: prefs },
      create: { key: keyFor(session.user.id), value: prefs, category: "notification_preference" },
    });

    return apiSuccess(setting.value);
  } catch (error) {
    return apiError(error);
  }
}