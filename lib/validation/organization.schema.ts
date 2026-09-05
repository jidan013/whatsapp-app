import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  description: z.string().max(500).optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export const createTechnicianSchema = z.object({
  userId: z.string().uuid("userId tidak valid"),
  employeeCode: z.string().min(2, "Kode karyawan minimal 2 karakter").max(50),
  departmentId: z.string().uuid().optional(),
  specialization: z.string().max(200).optional(),
  phoneNumber: z
    .string()
    .regex(/^\d{9,15}$/, "Nomor telepon harus 9-15 digit angka tanpa spasi/simbol")
    .optional(),
});

export const updateTechnicianSchema = createTechnicianSchema.partial().omit({ userId: true }).extend({
  isActive: z.boolean().optional(),
});

export type CreateTechnicianInput = z.infer<typeof createTechnicianSchema>;
export type UpdateTechnicianInput = z.infer<typeof updateTechnicianSchema>;
