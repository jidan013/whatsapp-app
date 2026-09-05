import { z } from "zod";

export const botCommandSchema = z.object({
  command: z.string().min(1, "Command wajib diisi").max(100),
  description: z.string().min(1, "Deskripsi wajib diisi").max(500),
  example: z.string().max(200).optional(),
});

export const botConfigSchema = z.object({
  botCommands: z.array(botCommandSchema).min(1, "Minimal 1 command"),
  webhookUrl: z.string().url("URL webhook tidak valid").max(500),
});

export type BotCommandInput = z.infer<typeof botCommandSchema>;
export type BotConfigInput = z.infer<typeof botConfigSchema>;