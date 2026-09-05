import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { agendaService } from "@/services/agenda.service";
import { generateAgendaQrCode } from "@/server/export/qrcode-generator";
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
    // Pastikan agenda ada dan user punya izin baca sebelum membuat QR code untuknya.
    await agendaService.getById(session, id);

    const result = await generateAgendaQrCode(id);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
