export const APP_CONFIG = {
  name: "WhatsApp Agenda System",
  timezone: process.env.APP_TIMEZONE ?? "Asia/Jakarta",
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  upload: {
    maxSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB ?? 50),
  },
  session: {
    maxAgeSeconds: Number(process.env.AUTH_SESSION_MAX_AGE ?? 2592000),
  },
} as const;
