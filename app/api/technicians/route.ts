import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { technicianService } from "@/services/technician.service";
import { createTechnicianSchema } from "@/lib/validation/organization.schema";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { UnauthorizedError } from "@/types/domain-errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const technicians = await technicianService.list(session);
    return apiSuccess(technicians);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const body: unknown = await request.json();
    const input = createTechnicianSchema.parse(body);

    const technician = await technicianService.create(session, input);
    return apiSuccess(technician, 201);
  } catch (error) {
    return apiError(error);
  }
}
