import "server-only";
import { departmentRepository } from "@/repositories/department.repository";
import { activityLogRepository } from "@/repositories/activity-log.repository";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { NotFoundError } from "@/types/domain-errors";
import type { CreateDepartmentInput, UpdateDepartmentInput } from "@/lib/validation/organization.schema";
import type { Session } from "next-auth";

export const departmentService = {
  async list(session: Session) {
    assertPermission(session, PERMISSIONS.DEPARTMENTS_MANAGE);
    return departmentRepository.findMany();
  },

  async create(session: Session, input: CreateDepartmentInput) {
    assertPermission(session, PERMISSIONS.DEPARTMENTS_MANAGE);
    const department = await departmentRepository.create(input);

    await activityLogRepository.record({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Department",
      entityId: department.id,
      description: `Membuat departemen "${department.name}"`,
    });

    return department;
  },

  async update(session: Session, id: string, input: UpdateDepartmentInput) {
    assertPermission(session, PERMISSIONS.DEPARTMENTS_MANAGE);

    const existing = await departmentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Department", id);
    }

    const updated = await departmentRepository.update(id, input);

    await activityLogRepository.record({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Department",
      entityId: id,
      description: `Memperbarui departemen "${updated.name}"`,
    });

    return updated;
  },

  async remove(session: Session, id: string) {
    assertPermission(session, PERMISSIONS.DEPARTMENTS_MANAGE);

    const existing = await departmentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Department", id);
    }

    await departmentRepository.softDelete(id);

    await activityLogRepository.record({
      userId: session.user.id,
      action: "DELETE",
      entityType: "Department",
      entityId: id,
      description: `Menghapus departemen "${existing.name}"`,
    });
  },
};
