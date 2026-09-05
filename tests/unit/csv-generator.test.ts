import { describe, it, expect } from "vitest";
import { generateAgendaCsv } from "@/server/export/csv-generator";
import type { Agenda, AgendaCategory, AgendaStatus, Technician, User } from "@prisma/client";

type AgendaExportRow = Agenda & {
  category: AgendaCategory;
  status: AgendaStatus;
  technician: (Technician & { user: User }) | null;
};

function buildRow(overrides: Partial<AgendaExportRow> = {}): AgendaExportRow {
  return {
    id: "agenda-1",
    title: "Perbaikan, AC Lantai 2",
    description: 'Deskripsi dengan "kutipan" di dalamnya',
    location: "Lantai 2",
    scheduledDate: new Date("2026-08-15"),
    scheduledTime: "09:00",
    priority: "MEDIUM",
    sourceChannel: "WEB",
    notes: null,
    categoryId: "cat-1",
    statusId: "status-1",
    departmentId: null,
    technicianId: null,
    createdById: "user-1",
    assignedToId: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    category: {
      id: "cat-1",
      name: "Perbaikan",
      description: null,
      colorHex: "#000",
      icon: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    status: {
      id: "status-1",
      name: "Pending",
      code: "PENDING",
      colorHex: "#000",
      isTerminal: false,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    technician: null,
    ...overrides,
  };
}

describe("generateAgendaCsv", () => {
  it("menghasilkan header row yang benar", () => {
    const csv = generateAgendaCsv([]).toString("utf-8");
    expect(csv).toBe("Judul,Kategori,Status,Prioritas,Tanggal,Jam,Lokasi,Teknisi,Deskripsi");
  });

  it("meng-escape koma dan tanda kutip dengan benar (RFC 4180)", () => {
    const csv = generateAgendaCsv([buildRow()]).toString("utf-8");
    const lines = csv.split("\n");
    expect(lines[1]).toContain('"Perbaikan, AC Lantai 2"');
    expect(lines[1]).toContain('""kutipan""');
  });

  it("menghasilkan satu baris per record", () => {
    const csv = generateAgendaCsv([buildRow(), buildRow({ id: "agenda-2" })]).toString("utf-8");
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 data rows
  });
});
