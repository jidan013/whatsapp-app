import "server-only";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { FEATURES_CONFIG } from "@/config/features.config";
import { logger } from "@/lib/logger/logger";

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password) {
    throw new Error("EMAIL_ENABLED=true tapi SMTP_HOST/SMTP_USER/SMTP_PASSWORD belum diisi lengkap di .env");
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });

  return cachedTransporter;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const emailService = {
  /**
   * Fitur opsional sesuai spesifikasi ("Email Notification (opsional)"). Tidak
   * melempar error jika EMAIL_ENABLED=false - cukup no-op dengan log info,
   * supaya caller (mis. notification service) tidak perlu cek flag berulang.
   */
  async send(input: SendEmailInput): Promise<{ sent: boolean }> {
    if (!FEATURES_CONFIG.emailNotificationEnabled) {
      logger.info({ to: input.to, subject: input.subject }, "Email notification dilewati (EMAIL_ENABLED=false)");
      return { sent: false };
    }

    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? "WhatsApp Agenda System <no-reply@localhost>",
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      return { sent: true };
    } catch (error) {
      logger.error({ err: error, to: input.to }, "Gagal mengirim email notification");
      return { sent: false };
    }
  },
};
