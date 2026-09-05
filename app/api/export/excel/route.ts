import type { NextRequest } from "next/server";
import { handleExportRequest } from "@/server/export/export-route.helper";

export async function POST(request: NextRequest) {
  return handleExportRequest(request, "EXCEL");
}
