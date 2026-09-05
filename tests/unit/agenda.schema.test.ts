import { describe, it, expect } from "vitest";
import { createAgendaSchema, agendaListFilterSchema } from "@/lib/validation/agenda.schema";

describe("createAgendaSchema", () => {
  const validInput = {
    title: "Perbaikan AC Lantai 2",
    description: "AC di ruang meeting lantai 2 tidak dingin, perlu pengecekan freon.",
    scheduledDate: "2026-08-15",
    categoryId: "550e8400-e29b-41d4-a716-446655440000",
  };

  it("menerima input valid dengan default priority MEDIUM", () => {
    const result = createAgendaSchema.parse(validInput);
    expect(result.priority).toBe("MEDIUM");
    expect(result.sourceChannel).toBe("WEB");
  });

  it("menolak judul kurang dari 3 karakter", () => {
    const result = createAgendaSchema.safeParse({ ...validInput, title: "AB" });
    expect(result.success).toBe(false);
  });

  it("menolak deskripsi kurang dari 10 karakter", () => {
    const result = createAgendaSchema.safeParse({ ...validInput, description: "Pendek" });
    expect(result.success).toBe(false);
  });

  it("menolak categoryId yang bukan UUID", () => {
    const result = createAgendaSchema.safeParse({ ...validInput, categoryId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("menolak format scheduledTime yang salah", () => {
    const result = createAgendaSchema.safeParse({ ...validInput, scheduledTime: "25:99" });
    expect(result.success).toBe(false);
  });

  it("menerima format scheduledTime yang benar", () => {
    const result = createAgendaSchema.safeParse({ ...validInput, scheduledTime: "09:30" });
    expect(result.success).toBe(true);
  });
});

describe("agendaListFilterSchema", () => {
  it("menerapkan default page=1 dan pageSize=20", () => {
    const result = agendaListFilterSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("menolak pageSize di atas 100", () => {
    const result = agendaListFilterSchema.safeParse({ pageSize: "500" });
    expect(result.success).toBe(false);
  });

  it("mengoersi string tanggal menjadi Date", () => {
    const result = agendaListFilterSchema.parse({ dateFrom: "2026-01-01" });
    expect(result.dateFrom).toBeInstanceOf(Date);
  });
});
