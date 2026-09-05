import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { agendaService } from "@/services/agenda.service";
import { updateAgendaSchema } from "@/lib/validation/agenda.schema";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { UnauthorizedError } from "@/types/domain-errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const { id } = await params;
    const agenda = await agendaService.getById(session, id);
    return apiSuccess(agenda);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const { id } = await params;
    const body: unknown = await request.json();
    const input = updateAgendaSchema.parse(body);

    const agenda = await agendaService.update(session, id, input);
    return apiSuccess(agenda);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const { id } = await params;
    await agendaService.remove(session, id);
    return apiSuccess({ id });
  } catch (error) {
    return apiError(error);
  }
}
