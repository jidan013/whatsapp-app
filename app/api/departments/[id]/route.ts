import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { departmentService } from "@/services/department.service";
import { updateDepartmentSchema } from "@/lib/validation/organization.schema";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { UnauthorizedError } from "@/types/domain-errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const { id } = await params;
    const body: unknown = await request.json();
    const input = updateDepartmentSchema.parse(body);

    const department = await departmentService.update(session, id, input);
    return apiSuccess(department);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const { id } = await params;
    await departmentService.remove(session, id);
    return apiSuccess({ id });
  } catch (error) {
    return apiError(error);
  }
}
