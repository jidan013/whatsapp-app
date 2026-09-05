import { sessionStore, type ConversationSession, type LaporFlowStep } from "@/bot/session/session-store";
import { listActiveCategories, findCategoryByIndex, createAgendaFromWhatsApp, findUserByWhatsAppNumber } from "@/bot/flows/lapor.data";
import { activityLogRepository } from "@/repositories/activity-log.repository";
import { storageDriver } from "@/lib/storage/local-storage-driver";
import { botLogger } from "@/bot/utils/logger";
import { CANCEL_KEYWORDS, BACK_KEYWORDS } from "@/bot/config";

export interface FlowReply {
  text: string;
  done?: boolean; // true jika flow selesai (sukses atau dibatalkan) dan session harus dihapus
}

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

function isCancel(text: string): boolean {
  return CANCEL_KEYWORDS.includes(text.trim().toLowerCase());
}

function isBack(text: string): boolean {
  return BACK_KEYWORDS.includes(text.trim().toLowerCase());
}

export async function handleLaporMedia(
  jid: string,
  mediaKind: "PHOTO" | "VIDEO" | "DOCUMENT",
  buffer: Buffer,
  originalName: string,
  onTimeout: (jid: string) => void,
): Promise<FlowReply> {
  const session = sessionStore.get(jid);
  if (!session) {
    return { text: 'Tidak ada laporan yang sedang berjalan. Ketik "#lapor" untuk memulai.', done: true };
  }

  const expectedStep: LaporFlowStep = mediaKind === "PHOTO" ? "PHOTO" : mediaKind === "VIDEO" ? "VIDEO" : "DOCUMENT";
  if (session.step !== expectedStep) {
    return { text: `Sedang tidak menunggu ${mediaKind.toLowerCase()}. Ikuti instruksi langkah saat ini.` };
  }

  try {
    const stored = await storageDriver.save(originalName, buffer);

    let updatedCount = 0;
    if (mediaKind === "PHOTO") {
      const existingPaths = session.data.photoPaths ?? [];
      updatedCount = existingPaths.length + 1;
      sessionStore.update(jid, { data: { photoPaths: [...existingPaths, stored.localPath] } }, onTimeout);
    } else if (mediaKind === "VIDEO") {
      const existingPaths = session.data.videoPaths ?? [];
      updatedCount = existingPaths.length + 1;
      sessionStore.update(jid, { data: { videoPaths: [...existingPaths, stored.localPath] } }, onTimeout);
    } else {
      const existingPaths = session.data.documentPaths ?? [];
      updatedCount = existingPaths.length + 1;
      sessionStore.update(jid, { data: { documentPaths: [...existingPaths, stored.localPath] } }, onTimeout);
    }

    return {
      text: `File diterima (${updatedCount} total). Kirim lagi jika ada, atau ketik "lanjut" untuk melanjutkan.`,
    };
  } catch (error) {
    botLogger.error({ err: error, jid, mediaKind }, "Gagal menyimpan media dari WhatsApp");
    return { text: "Gagal menyimpan file. Silakan coba kirim ulang." };
  }
}

async function promptForStep(step: LaporFlowStep): Promise<string> {
  switch (step) {
    case "CATEGORY": {
      const categories = await listActiveCategories();
      const list = categories.map((c, i) => `${i + 1}. ${c.name}`).join("\n");
      return `Silakan pilih kategori (ketik nomor):\n${list}\n\nKetik "batal" untuk membatalkan.`;
    }
    case "LOCATION":
      return "Masukkan lokasi pekerjaan:";
    case "DATE":
      return "Masukkan tanggal (format: YYYY-MM-DD), contoh: 2026-08-15";
    case "TIME":
      return "Masukkan jam (format: HH:mm), contoh: 09:30. Ketik \"skip\" jika tidak perlu.";
    case "PRIORITY":
      return `Pilih prioritas (ketik nomor):\n${PRIORITY_OPTIONS.map((p, i) => `${i + 1}. ${p}`).join("\n")}`;
    case "DESCRIPTION":
      return "Masukkan deskripsi pekerjaan:";
    case "PHOTO":
      return 'Kirim foto sekarang (bisa lebih dari satu, kirim satu per satu). Ketik "lanjut" jika sudah selesai atau tidak ada foto.';
    case "VIDEO":
      return 'Kirim video jika ada. Ketik "lanjut" jika sudah selesai atau tidak ada video.';
    case "DOCUMENT":
      return 'Kirim dokumen jika ada. Ketik "lanjut" jika sudah selesai atau tidak ada dokumen.';
    case "NOTES":
      return 'Tambahkan catatan tambahan jika ada, atau ketik "skip".';
    case "CONFIRM":
      return "";
  }
}

function buildConfirmationText(session: ConversationSession): string {
  const { data } = session;
  return [
    "Konfirmasi laporan:",
    `Kategori: ${data.categoryName ?? "-"}`,
    `Lokasi: ${data.location ?? "-"}`,
    `Tanggal: ${data.scheduledDate ?? "-"}`,
    `Jam: ${data.scheduledTime ?? "-"}`,
    `Prioritas: ${data.priority ?? "-"}`,
    `Deskripsi: ${data.description ?? "-"}`,
    `Foto: ${data.photoPaths?.length ?? 0} file`,
    `Video: ${data.videoPaths?.length ?? 0} file`,
    `Dokumen: ${data.documentPaths?.length ?? 0} file`,
    `Catatan: ${data.notes ?? "-"}`,
    "",
    'Ketik "ya" untuk simpan, "batal" untuk membatalkan, atau "kembali" untuk mengubah.',
  ].join("\n");
}

export async function startLaporFlow(jid: string, onTimeout: (jid: string) => void): Promise<FlowReply> {
  sessionStore.start(jid, onTimeout);
  const prompt = await promptForStep("CATEGORY");
  return { text: prompt };
}

export async function handleLaporMessage(
  jid: string,
  text: string,
  onTimeout: (jid: string) => void,
): Promise<FlowReply> {
  const session = sessionStore.get(jid);
  if (!session) {
    return { text: 'Tidak ada laporan yang sedang berjalan. Ketik "#lapor" untuk memulai.', done: true };
  }

  if (isCancel(text)) {
    sessionStore.clear(jid);
    return { text: "Laporan dibatalkan.", done: true };
  }

  if (isBack(text) && session.step !== "CATEGORY") {
    const updated = sessionStore.goBack(jid);
    const prompt = updated ? await promptForStep(updated.step) : "";
    return { text: prompt };
  }

  const trimmed = text.trim();

  switch (session.step) {
    case "CATEGORY": {
      const index = Number(trimmed) - 1;
      if (Number.isNaN(index) || index < 0) {
        return { text: 'Nomor tidak valid. Silakan pilih ulang, atau ketik "batal".' };
      }
      const category = await findCategoryByIndex(index);
      if (!category) {
        return { text: "Kategori tidak ditemukan. Silakan pilih ulang." };
      }
      sessionStore.update(jid, { step: "LOCATION", data: { categoryId: category.id, categoryName: category.name } }, onTimeout);
      return { text: await promptForStep("LOCATION") };
    }

    case "LOCATION": {
      if (trimmed.length < 3) {
        return { text: "Lokasi minimal 3 karakter. Silakan masukkan ulang." };
      }
      sessionStore.update(jid, { step: "DATE", data: { location: trimmed } }, onTimeout);
      return { text: await promptForStep("DATE") };
    }

    case "DATE": {
      const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) && !Number.isNaN(Date.parse(trimmed));
      if (!isValidDate) {
        return { text: "Format tanggal salah. Gunakan format YYYY-MM-DD, contoh: 2026-08-15." };
      }
      sessionStore.update(jid, { step: "TIME", data: { scheduledDate: trimmed } }, onTimeout);
      return { text: await promptForStep("TIME") };
    }

    case "TIME": {
      if (trimmed.toLowerCase() === "skip") {
        sessionStore.update(jid, { step: "PRIORITY", data: {} }, onTimeout);
        return { text: await promptForStep("PRIORITY") };
      }
      const isValidTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed);
      if (!isValidTime) {
        return { text: 'Format jam salah. Gunakan format HH:mm, contoh: 09:30, atau ketik "skip".' };
      }
      sessionStore.update(jid, { step: "PRIORITY", data: { scheduledTime: trimmed } }, onTimeout);
      return { text: await promptForStep("PRIORITY") };
    }

    case "PRIORITY": {
      const index = Number(trimmed) - 1;
      const priority = PRIORITY_OPTIONS[index];
      if (!priority) {
        return { text: "Nomor tidak valid. Silakan pilih ulang." };
      }
      sessionStore.update(jid, { step: "DESCRIPTION", data: { priority } }, onTimeout);
      return { text: await promptForStep("DESCRIPTION") };
    }

    case "DESCRIPTION": {
      if (trimmed.length < 10) {
        return { text: "Deskripsi minimal 10 karakter. Silakan masukkan ulang." };
      }
      sessionStore.update(jid, { step: "PHOTO", data: { description: trimmed } }, onTimeout);
      return { text: await promptForStep("PHOTO") };
    }

    case "PHOTO": {
      if (trimmed.toLowerCase() === "lanjut") {
        sessionStore.update(jid, { step: "VIDEO", data: {} }, onTimeout);
        return { text: await promptForStep("VIDEO") };
      }
      // Penanganan file foto aktual dilakukan di message-handler.ts (event pesan media),
      // bukan di sini (di sini hanya menangani pesan teks).
      return { text: 'Kirim foto, atau ketik "lanjut" jika sudah selesai.' };
    }

    case "VIDEO": {
      if (trimmed.toLowerCase() === "lanjut") {
        sessionStore.update(jid, { step: "DOCUMENT", data: {} }, onTimeout);
        return { text: await promptForStep("DOCUMENT") };
      }
      return { text: 'Kirim video, atau ketik "lanjut" jika sudah selesai.' };
    }

    case "DOCUMENT": {
      if (trimmed.toLowerCase() === "lanjut") {
        sessionStore.update(jid, { step: "NOTES", data: {} }, onTimeout);
        return { text: await promptForStep("NOTES") };
      }
      return { text: 'Kirim dokumen, atau ketik "lanjut" jika sudah selesai.' };
    }

    case "NOTES": {
      const notes = trimmed.toLowerCase() === "skip" ? undefined : trimmed;
      const updated = sessionStore.update(jid, { step: "CONFIRM", data: { notes } }, onTimeout);
      return { text: updated ? buildConfirmationText(updated) : "" };
    }

    case "CONFIRM": {
      if (trimmed.toLowerCase() !== "ya") {
        return { text: 'Ketik "ya" untuk simpan, "batal" untuk membatalkan, atau "kembali" untuk mengubah.' };
      }

      const user = await findUserByWhatsAppNumber(jid.split("@")[0] ?? jid);
      if (!user) {
        sessionStore.clear(jid);
        return {
          text: "Nomor WhatsApp Anda belum terdaftar sebagai user sistem. Hubungi admin untuk didaftarkan terlebih dahulu.",
          done: true,
        };
      }

      try {
        const agenda = await createAgendaFromWhatsApp({ data: session.data, createdByUserId: user.id });
        await activityLogRepository.record({
          userId: user.id,
          action: "CREATE",
          entityType: "Agenda",
          entityId: agenda.id,
          description: `Membuat agenda "${agenda.title}" via WhatsApp bot`,
        });
        sessionStore.clear(jid);
        return { text: `Laporan berhasil disimpan dengan ID: ${agenda.id}`, done: true };
      } catch (error) {
        botLogger.error({ err: error, jid }, "Failed to save agenda from WhatsApp flow");
        sessionStore.clear(jid);
        return { text: "Gagal menyimpan laporan. Silakan coba lagi dengan #lapor.", done: true };
      }
    }
  }
}
