import "server-only";
import { technicianRepository } from "@/repositories/technician.repository";
import { activityLogRepository } from "@/repositories/activity-log.repository";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { NotFoundError, ConflictError } from "@/types/domain-errors";
import type { CreateTechnicianInput, UpdateTechnicianInput } from "@/lib/validation/organization.schema";
import type { Session } from "next-auth";

export const technicianService = {
  async list(session: Session) {
    assertPermission(session, PERMISSIONS.USERS_READ);
    return technicianRepository.findMany();
  },

  async create(session: Session, input: CreateTechnicianInput) {
    assertPermission(session, PERMISSIONS.USERS_MANAGE);

    const existing = await technicianRepository.findByUserId(input.userId);
    if (existing) {
      throw new ConflictError("User ini sudah terdaftar sebagai teknisi");
    }

    const technician = await technicianRepository.create(input);

    await activityLogRepository.record({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Technician",
      entityId: technician.id,
      description: `Mendaftarkan teknisi "${technician.user.name}"`,
    });

    return technician;
  },

  async update(session: Session, id: string, input: UpdateTechnicianInput) {
    assertPermission(session, PERMISSIONS.USERS_MANAGE);

    const existing = await technicianRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Technician", id);
    }

    const updated = await technicianRepository.update(id, input);

    await activityLogRepository.record({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Technician",
      entityId: id,
      description: `Memperbarui data teknisi "${updated.user.name}"`,
    });

    return updated;
  },

  async remove(session: Session, id: string) {
    assertPermission(session, PERMISSIONS.USERS_MANAGE);

    const existing = await technicianRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Technician", id);
    }

    await technicianRepository.softDelete(id);

    await activityLogRepository.record({
      userId: session.user.id,
      action: "DELETE",
      entityType: "Technician",
      entityId: id,
      description: `Menonaktifkan teknisi "${existing.user.name}"`,
    });
  },
};
