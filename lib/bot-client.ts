import "server-only";

const BOT_HEALTHCHECK_PORT = process.env.BOT_HEALTHCHECK_PORT ?? "3001";
const BOT_BASE_URL = `http://localhost:${BOT_HEALTHCHECK_PORT}`;

export interface BotStatus {
  connected: boolean;
  phoneNumber: string | null;
  lastPingAt: string | null;
}

export interface BotQrCode {
  qr: string | null; // data URL PNG, atau null kalau sudah terhubung / belum ada QR baru
}

async function fetchWithTimeout(path: string, options: RequestInit = {}, timeoutMs = 3000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${BOT_BASE_URL}${path}`, { ...options, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timeout);
  }
}

export const botClient = {
  async getStatus(): Promise<BotStatus> {
    try {
      const res = await fetchWithTimeout("/status");
      if (!res.ok) throw new Error("Bot healthcheck merespons error");
      return (await res.json()) as BotStatus;
    } catch {
      return { connected: false, phoneNumber: null, lastPingAt: null };
    }
  },

  async getQrCode(): Promise<BotQrCode> {
    try {
      const res = await fetchWithTimeout("/qrcode");
      if (!res.ok) throw new Error("Bot QR endpoint merespons error");
      return (await res.json()) as BotQrCode;
    } catch {
      return { qr: null };
    }
  },

  async disconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetchWithTimeout("/disconnect", { method: "POST" });
      return (await res.json()) as { success: boolean; error?: string };
    } catch {
      return { success: false, error: "Tidak dapat menghubungi proses bot" };
    }
  },

  async reconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetchWithTimeout("/reconnect", { method: "POST" });
      return (await res.json()) as { success: boolean; error?: string };
    } catch {
      return { success: false, error: "Tidak dapat menghubungi proses bot" };
    }
  },
};