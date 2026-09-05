import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { exportService } from "@/server/export/export.service";
import { agendaListFilterSchema } from "@/lib/validation/agenda.schema";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { UnauthorizedError, DomainError } from "@/types/domain-errors";
import { checkRateLimit, getClientIp } from "@/middleware/rate-limit";
import type { ExportFormat } from "@prisma/client";

export async function handleExportRequest(request: NextRequest, format: ExportFormat) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const rateLimitKey = `export:${session.user.id}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      throw new DomainError("Terlalu banyak permintaan export. Silakan coba lagi beberapa saat lagi.");
    }
    void getClientIp(request.headers); // tersedia untuk audit log lebih lanjut jika diperlukan

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filter = agendaListFilterSchema.partial().parse(searchParams);

    const exportRecord = await exportService.createExport(session, format, filter);
    return apiSuccess(exportRecord, 201);
  } catch (error) {
    return apiError(error);
  }
}
