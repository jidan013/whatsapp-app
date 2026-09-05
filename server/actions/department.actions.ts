"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { departmentService } from "@/services/department.service";
import { createDepartmentSchema } from "@/lib/validation/organization.schema";
import { DomainError } from "@/types/domain-errors";
import type { ActionResult } from "@/server/actions/agenda.actions";
import type { Department } from "@prisma/client";

export async function createDepartmentAction(
  _previousState: ActionResult<Department> | null,
  formData: FormData,
): Promise<ActionResult<Department>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Anda belum login" };
  }

  const parsed = createDepartmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: "Validasi gagal", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const department = await departmentService.create(session, parsed.data);
    revalidatePath("/departments");
    return { success: true, data: department };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Terjadi kesalahan pada server" };
  }
}
