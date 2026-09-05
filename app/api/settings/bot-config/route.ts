import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import { botConfigSchema } from "@/lib/validation/bot-config.schema";
import { UnauthorizedError } from "@/types/domain-errors";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();
    assertPermission(session, PERMISSIONS.SETTINGS_MANAGE);

    const body: unknown = await request.json();
    const input = botConfigSchema.parse(body);

    await prisma.$transaction([
      prisma.setting.upsert({
        where: { key: "bot.commands" },
        update: { value: input.botCommands },
        create: { key: "bot.commands", value: input.botCommands, category: "whatsapp" },
      }),
      prisma.setting.upsert({
        where: { key: "webhook.url" },
        update: { value: input.webhookUrl },
        create: { key: "webhook.url", value: input.webhookUrl, category: "whatsapp" },
      }),
    ]);

    return apiSuccess(input);
  } catch (error) {
    return apiError(error);
  }
}