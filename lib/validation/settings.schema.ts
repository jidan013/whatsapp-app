import { z } from "zod";

export const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
  category: z.enum(["general", "whatsapp", "google_drive", "backup", "notification"]).default("general"),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
