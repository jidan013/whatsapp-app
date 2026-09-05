import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { findUserByWhatsAppNumber } from "@/bot/flows/lapor.data";
import { botLogger } from "@/bot/utils/logger";

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function handleDetailCommand(argument: string): Promise<string> {
  const id = argument.trim();
  if (!isValidUuid(id)) {
    return 'Format: "#detail <id-agenda>". Contoh: #detail 550e8400-e29b-41d4-a716-446655440000';
  }

  const agenda = await prisma.agenda.findFirst({
    where: { id, deletedAt: null },
    include: { category: true, status: true, technician: { include: { user: true } } },
  });

  if (!agenda) {
    return "Agenda tidak ditemukan.";
  }

  return [
    `*${agenda.title}*`,
    `Kategori: ${agenda.category.name}`,
    `Status: ${agenda.status.name}`,
    `Prioritas: ${agenda.priority}`,
    `Tanggal: ${format(new Date(agenda.scheduledDate), "d MMM yyyy", { locale: localeId })}${agenda.scheduledTime ? ` ${agenda.scheduledTime}` : ""}`,
    `Lokasi: ${agenda.location ?? "-"}`,
    `Teknisi: ${agenda.technician?.user.name ?? "-"}`,
    `Deskripsi: ${agenda.description}`,
  ].join("\n");
}

export async function handleSearchCommand(keyword: string): Promise<string> {
  const trimmed = keyword.trim();
  if (trimmed.length < 2) {
    return 'Format: "#search <kata kunci>". Kata kunci minimal 2 karakter.';
  }

  const results = await prisma.agenda.findMany({
    where: {
      deletedAt: null,
      OR: [
        { title: { contains: trimmed, mode: "insensitive" } },
        { description: { contains: trimmed, mode: "insensitive" } },
        { location: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    take: 10,
    orderBy: { scheduledDate: "desc" },
  });

  if (results.length === 0) {
    return `Tidak ada hasil untuk "${trimmed}".`;
  }

  return results
    .map((agenda) => `• ${agenda.id}\n  ${agenda.title} (${format(new Date(agenda.scheduledDate), "d MMM yyyy", { locale: localeId })})`)
    .join("\n\n");
}

export async function handleCompleteCommand(argument: string, jid: string): Promise<string> {
  const id = argument.trim();
  if (!isValidUuid(id)) {
    return 'Format: "#complete <id-agenda>"';
  }

  const user = await findUserByWhatsAppNumber(jid.split("@")[0] ?? jid);
  if (!user) {
    return "Nomor WhatsApp Anda belum terdaftar sebagai user sistem.";
  }

  const agenda = await prisma.agenda.findFirst({ where: { id, deletedAt: null } });
  if (!agenda) {
    return "Agenda tidak ditemukan.";
  }

  const completedStatus = await prisma.agendaStatus.findUnique({ where: { code: "COMPLETED" } });
  if (!completedStatus) {
    botLogger.error("Status COMPLETED tidak ditemukan di database, jalankan seed");
    return "Terjadi kesalahan sistem. Hubungi admin.";
  }

  await prisma.agenda.update({
    where: { id },
    data: { statusId: completedStatus.id, completedAt: new Date() },
  });

  return `Agenda "${agenda.title}" ditandai selesai.`;
}

export async function handleDeleteCommand(argument: string, jid: string): Promise<string> {
  const id = argument.trim();
  if (!isValidUuid(id)) {
    return 'Format: "#delete <id-agenda>"';
  }

  const user = await findUserByWhatsAppNumber(jid.split("@")[0] ?? jid);
  if (!user) {
    return "Nomor WhatsApp Anda belum terdaftar sebagai user sistem.";
  }

  const agenda = await prisma.agenda.findFirst({ where: { id, deletedAt: null } });
  if (!agenda) {
    return "Agenda tidak ditemukan.";
  }

  await prisma.agenda.update({ where: { id }, data: { deletedAt: new Date() } });

  return `Agenda "${agenda.title}" dihapus.`;
}
