import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { departmentService } from "@/services/department.service";
import { createDepartmentSchema } from "@/lib/validation/organization.schema";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { UnauthorizedError } from "@/types/domain-errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const departments = await departmentService.list(session);
    return apiSuccess(departments);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const body: unknown = await request.json();
    const input = createDepartmentSchema.parse(body);

    const department = await departmentService.create(session, input);
    return apiSuccess(department, 201);
  } catch (error) {
    return apiError(error);
  }
}
