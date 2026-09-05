// app/api/export/list/route.ts
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { exportService } from "@/server/export/export.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { UnauthorizedError } from "@/types/domain-errors";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const result = await exportService.listExports(session, { skip, take });
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}