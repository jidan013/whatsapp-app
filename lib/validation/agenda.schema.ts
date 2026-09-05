import { z } from "zod";

export const createAgendaSchema = z
  .object({
    title: z.string().min(1, "Judul wajib diisi").max(255),
    description: z.string().optional(),
    location: z.string().optional().nullable(),
    scheduledDate: z.coerce.date({ required_error: "Tanggal mulai wajib diisi" }),
    scheduledTime: z.string().optional().nullable(),
    scheduledEndDate: z.coerce.date().optional().nullable(),
    scheduledEndTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam harus HH:mm")
      .optional()
      .nullable(),
    categoryId: z.string().min(1, "Kategori wajib dipilih"),
    statusId: z.string().min(1, "Status wajib dipilih").optional(),
    technicianId: z.string().optional().nullable(),
    // Ditambahkan supaya tidak di-strip diam-diam oleh Zod - form mengirim
    // checkbox "technicianIds" (jamak), tapi kolom di database (Agenda.technicianId)
    // cuma menampung SATU teknisi. Konversi jamak -> tunggal dilakukan di action layer.
    technicianIds: z.array(z.string()).optional().default([]),
    priority: z.enum(["RENDAH", "SEDANG", "TINGGI", "URGENT"]).default("SEDANG"),
    notes: z.string().optional().nullable(),
    sourceChannel: z.enum(["WEB", "WHATSAPP", "API"]).default("WEB"),
    departmentId: z.string().optional().nullable(),
    assignedToId: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.scheduledEndDate) return true;
      return data.scheduledEndDate >= data.scheduledDate;
    },
    { message: "Tanggal selesai tidak boleh sebelum tanggal mulai", path: ["scheduledEndDate"] },
  );

export const updateAgendaSchema = createAgendaSchema.innerType().partial().extend({
  id: z.string(),
  statusId: z.string().optional(),
});

export const agendaListFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  tanggal: z.string().optional(),
  teknisi: z.string().optional(),
  status: z.string().optional(),
  prioritas: z.string().optional(),
  search: z.string().optional(),
  orderBy: z.enum(["scheduledDate", "createdAt", "priority"]).optional().default("scheduledDate"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Tipe untuk input ke service list
export type AgendaListFilterInput = z.infer<typeof agendaListFilterSchema>;
// Tipe untuk filter repository (sudah ada)
export type AgendaListFilter = AgendaListFilterInput;

export type CreateAgendaInput = z.infer<typeof createAgendaSchema>;
export type UpdateAgendaInput = z.infer<typeof updateAgendaSchema>;