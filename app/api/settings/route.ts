import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { settingsService } from "@/services/settings.service";
import { updateSettingSchema } from "@/lib/validation/settings.schema";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { UnauthorizedError } from "@/types/domain-errors";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const category = request.nextUrl.searchParams.get("category") ?? undefined;
    const settings = await settingsService.list(category);
    return apiSuccess(settings);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const body: unknown = await request.json();
    const input = updateSettingSchema.parse(body);

    const setting = await settingsService.set(session, input.key, input.value as Prisma.InputJsonValue, input.category);
    return apiSuccess(setting);
  } catch (error) {
    return apiError(error);
  }
}
