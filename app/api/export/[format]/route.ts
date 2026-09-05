// app/api/export/[format]/route.ts
import type { NextRequest } from "next/server";
import type { ExportFormat } from "@prisma/client";
import { auth } from "@/lib/auth/auth";
import { exportService } from "@/server/export/export.service";
import { agendaListFilterSchema } from "@/lib/validation/agenda.schema";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { UnauthorizedError, DomainError } from "@/types/domain-errors";
import { checkRateLimit } from "@/middleware/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ format: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const rateLimitKey = `export:${session.user.id}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      throw new DomainError(
        "Terlalu banyak permintaan export. Silakan coba lagi beberapa saat lagi."
      );
    }

    const { format } = await params;
    const validFormats: ExportFormat[] = ["PDF", "EXCEL", "CSV"];
    const exportFormat = format.toUpperCase() as ExportFormat;

    if (!validFormats.includes(exportFormat)) {
      throw new DomainError(`Format export tidak valid: ${format}`);
    }

    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );
    const filter = agendaListFilterSchema.partial().parse(searchParams);

    const exportRecord = await exportService.createExport(
      session,
      exportFormat,
      filter
    );

    return apiSuccess(exportRecord, 201);
  } catch (error) {
    return apiError(error);
  }
}