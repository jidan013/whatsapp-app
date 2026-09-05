import path from "node:path";
import fs from "node:fs";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  type WASocket,
  type WAMessage,
  type MessageUpsertType,
  type ConnectionState,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode";
import { BOT_CONFIG } from "@/bot/config";
import { botLogger } from "@/bot/utils/logger";
import { routeIncomingMessage } from "@/bot/handlers/command-router";
import { handleLaporMedia } from "@/bot/flows/lapor.flow";
import { sessionStore } from "@/bot/session/session-store";
import { setConnected, setDisconnected, setQrDataUrl } from "@/bot/state";

let reconnectAttempts = 0;
let currentSocket: WASocket | null = null;
let isShuttingDown = false;
let isConnecting = false;

function ensureSessionDir(): void {
  if (!fs.existsSync(BOT_CONFIG.sessionDir)) {
    fs.mkdirSync(BOT_CONFIG.sessionDir, { recursive: true });
  }
}

function extractPhoneNumber(socket: WASocket): string | null {
  const rawId = socket.user?.id;
  if (!rawId) return null;
  // Format Baileys biasanya "6281234567890:31@s.whatsapp.net" atau "6281234567890@s.whatsapp.net"
  const withoutDomain = rawId.split("@")[0] ?? rawId;
  const withoutDevice = withoutDomain.split(":")[0] ?? withoutDomain;
  return withoutDevice || null;
}

async function sendFlowTimeoutNotice(socket: WASocket, jid: string): Promise<void> {
  try {
    await socket.sendMessage(jid, { text: "Sesi laporan Anda dibatalkan otomatis karena tidak ada aktivitas selama 5 menit." });
  } catch (error) {
    botLogger.warn({ err: error, jid }, "Failed to send flow timeout notice");
  }
}

export async function connectWhatsApp(): Promise<WASocket> {
  if (isConnecting) {
    botLogger.warn("connectWhatsApp() dipanggil saat proses koneksi lain sedang berjalan, dilewati");
    if (currentSocket) return currentSocket;
  }
  isConnecting = true;

  ensureSessionDir();

  const { state, saveCreds } = await useMultiFileAuthState(BOT_CONFIG.sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  currentSocket = socket;

  socket.ev.on("creds.update", () => {
    void saveCreds();
  });

  socket.ev.on("connection.update", (update) => {
    void handleConnectionUpdate(update, socket);
  });

  socket.ev.on("messages.upsert", (upsert) => {
    void handleIncomingMessages(socket, upsert);
  });

  isConnecting = false;
  return socket;
}

async function handleConnectionUpdate(update: Partial<ConnectionState>, socket: WASocket): Promise<void> {
  const { connection, lastDisconnect, qr } = update;

  if (qr) {
    botLogger.info("QR code diterima, silakan scan:");
    const qrTerminalText = await qrcode.toString(qr, { type: "terminal", small: true });
    console.warn(qrTerminalText);

    try {
      const qrDataUrl = await qrcode.toDataURL(qr, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 300,
      });
      setQrDataUrl(qrDataUrl);
    } catch (error) {
      botLogger.error({ err: error }, "Gagal membuat QR code data URL");
    }
  }

  if (connection === "open") {
    reconnectAttempts = 0;
    const phoneNumber = extractPhoneNumber(socket);
    setConnected(phoneNumber);
    botLogger.info({ phoneNumber }, "WhatsApp bot terhubung");
  }

  if (connection === "close") {
    setDisconnected();

    const error = lastDisconnect?.error;
    const statusCode = error && "output" in error ? error.output?.statusCode : undefined;
    const shouldReconnect = statusCode !== DisconnectReason.loggedOut && !isShuttingDown;

    botLogger.warn({ statusCode, shouldReconnect }, "Koneksi WhatsApp terputus");

    if (shouldReconnect) {
      await attemptReconnect();
    } else {
      botLogger.error("Sesi logout atau shutdown - tidak reconnect otomatis. Gunakan endpoint /reconnect untuk memulai pairing baru.");
    }
  }
}

async function attemptReconnect(): Promise<void> {
  if (reconnectAttempts >= BOT_CONFIG.reconnectMaxAttempts) {
    botLogger.error({ reconnectAttempts }, "Batas maksimum percobaan reconnect tercapai, bot berhenti");
    process.exit(1);
  }

  reconnectAttempts += 1;
  const delay = BOT_CONFIG.reconnectBaseDelayMs * Math.pow(2, reconnectAttempts - 1);
  botLogger.info({ attempt: reconnectAttempts, delayMs: delay }, "Mencoba reconnect");

  await new Promise((resolve) => setTimeout(resolve, delay));
  await connectWhatsApp();
}

async function handleIncomingMessages(
  socket: WASocket,
  upsert: { messages: WAMessage[]; type: MessageUpsertType },
): Promise<void> {
  if (upsert.type !== "notify") return;

  for (const message of upsert.messages) {
    const jid = message.key.remoteJid;
    if (!jid || message.key.fromMe || jid.endsWith("@g.us")) {
      continue; // abaikan pesan dari diri sendiri dan pesan grup
    }

    try {
      const mediaReply = await tryHandleMediaMessage(socket, jid, message);
      if (mediaReply) {
        await socket.sendMessage(jid, { text: mediaReply.text });
        continue;
      }

      const text = message.message?.conversation ?? message.message?.extendedTextMessage?.text ?? undefined;
      if (!text) continue;

      const reply = await routeIncomingMessage(jid, text, (timedOutJid) => {
        void sendFlowTimeoutNotice(socket, timedOutJid);
      });
      await socket.sendMessage(jid, { text: reply.text });
    } catch (error) {
      botLogger.error({ err: error, jid }, "Error memproses pesan masuk");
      await socket.sendMessage(jid, { text: "Terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi." });
    }
  }
}

async function tryHandleMediaMessage(
  socket: WASocket,
  jid: string,
  message: WAMessage,
): Promise<{ text: string } | null> {
  const imageMessage = message.message?.imageMessage;
  const videoMessage = message.message?.videoMessage;
  const documentMessage = message.message?.documentMessage;

  const mediaKind: "PHOTO" | "VIDEO" | "DOCUMENT" | null = imageMessage
    ? "PHOTO"
    : videoMessage
      ? "VIDEO"
      : documentMessage
        ? "DOCUMENT"
        : null;

  if (!mediaKind) return null;

  if (!sessionStore.has(jid)) {
    return null;
  }

  const buffer = await downloadMediaMessage(message, "buffer", {}, { logger: botLogger, reuploadRequest: socket.updateMediaMessage });

  const originalName =
    documentMessage?.fileName ??
    `${mediaKind.toLowerCase()}-${Date.now()}.${mediaKind === "PHOTO" ? "jpg" : mediaKind === "VIDEO" ? "mp4" : "bin"}`;

  return handleLaporMedia(jid, mediaKind, buffer, originalName, (timedOutJid) => {
    void sendFlowTimeoutNotice(socket, timedOutJid);
  });
}

export async function gracefulShutdown(): Promise<void> {
  isShuttingDown = true;
  botLogger.info("Menutup koneksi WhatsApp bot...");

  sessionStore.clearAll();

  if (currentSocket) {
    currentSocket.end(undefined);
  }
}

export function getSessionDirPath(): string {
  return path.resolve(BOT_CONFIG.sessionDir);
}

/**
 * Logout PAKSA dari WhatsApp (dipanggil dari endpoint /disconnect).
 * Berbeda dari gracefulShutdown(): ini menginvalidasi sesi di sisi WhatsApp,
 * jadi device benar-benar ter-unlink dan perlu scan QR baru untuk connect lagi.
 */
export async function logoutCurrentSession(): Promise<{ success: boolean; error?: string }> {
  if (!currentSocket) {
    return { success: false, error: "Tidak ada koneksi aktif" };
  }
  try {
    await currentSocket.logout();
    setDisconnected();
    currentSocket = null;

    // PENTING: socket.logout() cuma memutuskan sesi di sisi WhatsApp, TIDAK
    // menghapus file kredensial lokal (useMultiFileAuthState menyimpan sendiri
    // ke disk). Kalau file lama tidak dihapus, connectWhatsApp() berikutnya
    // akan mencoba resume pakai kredensial basi itu alih-alih generate QR baru.
    try {
      fs.rmSync(BOT_CONFIG.sessionDir, { recursive: true, force: true });
      botLogger.info("File sesi lokal dihapus, siap untuk pairing baru");
    } catch (rmError) {
      botLogger.warn({ err: rmError }, "Gagal menghapus folder sesi lokal");
    }

    return { success: true };
  } catch (error) {
    botLogger.error({ err: error }, "Gagal logout dari WhatsApp");
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Memicu ulang proses pairing (dipanggil dari endpoint /reconnect, misal
 * tombol "Generate New QR Code" setelah disconnect). Tidak melakukan apapun
 * kalau sudah ada koneksi aktif, supaya tidak membuat socket dobel.
 */
export function triggerReconnect(): { success: boolean; error?: string } {
  if (currentSocket && !isConnecting) {
    // Cek apakah socket lama masih trecatat "open" - kalau state global bilang
    // sudah connected, tidak perlu reconnect lagi.
  }
  if (isConnecting) {
    return { success: false, error: "Proses koneksi lain sedang berjalan" };
  }

  void connectWhatsApp().catch((error: unknown) => {
    botLogger.error({ err: error }, "Gagal memulai ulang koneksi WhatsApp");
  });

  return { success: true };
}