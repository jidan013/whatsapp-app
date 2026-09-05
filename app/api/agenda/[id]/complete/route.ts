import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { agendaService } from "@/services/agenda.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { UnauthorizedError } from "@/types/domain-errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const { id } = await params;
    const agenda = await agendaService.markCompleted(session, id);
    return apiSuccess(agenda);
  } catch (error) {
    return apiError(error);
  }
}
