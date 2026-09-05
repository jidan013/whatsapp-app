import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { agendaService } from "@/services/agenda.service";
import { agendaListFilterSchema, createAgendaSchema } from "@/lib/validation/agenda.schema";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { UnauthorizedError } from "@/types/domain-errors";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filter = agendaListFilterSchema.parse(searchParams);

    const result = await agendaService.list(session, filter);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const body: unknown = await request.json();
    const input = createAgendaSchema.parse(body);

    const agenda = await agendaService.create(session, input);
    return apiSuccess(agenda, 201);
  } catch (error) {
    return apiError(error);
  }
}
