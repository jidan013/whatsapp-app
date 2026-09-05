import type { Agenda, AgendaCategory, AgendaStatus, Technician, User } from "@prisma/client";

export type AgendaExportRow = Agenda & {
  category: AgendaCategory;
  status: AgendaStatus;
  technician: (Technician & { user: User }) | null;
};
