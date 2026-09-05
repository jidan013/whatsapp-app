import path from "node:path";

export const BOT_CONFIG = {
  sessionDir: process.env.BOT_SESSION_DIR ?? path.join(process.cwd(), "storage", "bot-session"),
  adminNumbers: (process.env.BOT_ADMIN_NUMBERS ?? "").split(",").map((n) => n.trim()).filter(Boolean),
  reconnectMaxAttempts: Number(process.env.BOT_RECONNECT_MAX_ATTEMPTS ?? 10),
  reconnectBaseDelayMs: Number(process.env.BOT_RECONNECT_BASE_DELAY_MS ?? 2000),
  commandTimeoutMs: Number(process.env.BOT_COMMAND_TIMEOUT_MS ?? 300_000),
  healthcheckPort: Number(process.env.BOT_HEALTHCHECK_PORT ?? 3001),
} as const;

export const BOT_COMMANDS = {
  HELP: "#help",
  AGENDA: "#agenda",
  LAPOR: "#lapor",
  TODAY: "#today",
  TOMORROW: "#tomorrow",
  WEEK: "#week",
  MONTH: "#month",
  CALENDAR: "#calendar",
  SEARCH: "#search",
  DETAIL: "#detail",
  EDIT: "#edit",
  DELETE: "#delete",
  COMPLETE: "#complete",
  PENDING: "#pending",
  DASHBOARD: "#dashboard",
  BACKUP: "#backup",
  RESTORE: "#restore",
  EXPORT: "#export",
  PDF: "#pdf",
  EXCEL: "#excel",
  STATISTICS: "#statistics",
  PROFILE: "#profile",
  SETTINGS: "#settings",
  PING: "#ping",
} as const;

export const CONVERSATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 menit tanpa respons -> flow dibatalkan otomatis
export const CANCEL_KEYWORDS = ["batal", "cancel", "#batal"];
export const BACK_KEYWORDS = ["kembali", "back", "#kembali"];
