import { prisma } from "@/lib/prisma";
import { format, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { findUserByWhatsAppNumber } from "@/bot/flows/lapor.data";
import { BOT_COMMANDS } from "@/bot/config";

function formatAgendaLine(agenda: { title: string; scheduledDate: Date; scheduledTime: string | null; priority: string }): string {
  const date = format(new Date(agenda.scheduledDate), "d MMM", { locale: localeId });
  const time = agenda.scheduledTime ? ` ${agenda.scheduledTime}` : "";
  return `• [${agenda.priority}] ${date}${time} - ${agenda.title}`;
}

async function listAgendaInRange(from: Date, to: Date): Promise<string> {
  const items = await prisma.agenda.findMany({
    where: { deletedAt: null, scheduledDate: { gte: from, lte: to } },
    orderBy: { scheduledDate: "asc" },
    take: 30,
  });

  if (items.length === 0) {
    return "Tidak ada agenda pada periode ini.";
  }

  return items.map(formatAgendaLine).join("\n");
}

export async function handleTodayCommand(): Promise<string> {
  const now = new Date();
  return listAgendaInRange(startOfDay(now), endOfDay(now));
}

export async function handleTomorrowCommand(): Promise<string> {
  const tomorrow = addDays(new Date(), 1);
  return listAgendaInRange(startOfDay(tomorrow), endOfDay(tomorrow));
}

export async function handleWeekCommand(): Promise<string> {
  const now = new Date();
  return listAgendaInRange(startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 }));
}

export async function handleMonthCommand(): Promise<string> {
  const now = new Date();
  return listAgendaInRange(startOfMonth(now), endOfMonth(now));
}

export async function handlePendingCommand(): Promise<string> {
  const items = await prisma.agenda.findMany({
    where: { deletedAt: null, status: { code: "PENDING" } },
    orderBy: { scheduledDate: "asc" },
    take: 30,
  });

  if (items.length === 0) return "Tidak ada agenda pending.";
  return items.map(formatAgendaLine).join("\n");
}

export async function handleStatisticsCommand(): Promise<string> {
  const [total, pending, inProgress, completed] = await Promise.all([
    prisma.agenda.count({ where: { deletedAt: null } }),
    prisma.agenda.count({ where: { deletedAt: null, status: { code: "PENDING" } } }),
    prisma.agenda.count({ where: { deletedAt: null, status: { code: "IN_PROGRESS" } } }),
    prisma.agenda.count({ where: { deletedAt: null, status: { code: "COMPLETED" } } }),
  ]);

  return [
    "Statistik Agenda:",
    `Total: ${total}`,
    `Pending: ${pending}`,
    `Sedang Dikerjakan: ${inProgress}`,
    `Selesai: ${completed}`,
  ].join("\n");
}

export async function handleProfileCommand(jid: string): Promise<string> {
  const user = await findUserByWhatsAppNumber(jid.split("@")[0] ?? jid);
  if (!user) {
    return "Nomor WhatsApp Anda belum terdaftar. Hubungi admin.";
  }
  return [`Nama: ${user.name}`, `Email: ${user.email}`, `Status: ${user.isActive ? "Aktif" : "Nonaktif"}`].join("\n");
}

export function handlePingCommand(): string {
  return `Pong! Bot aktif. ${new Date().toISOString()}`;
}

export function handleHelpCommand(): string {
  return [
    "Daftar perintah:",
    ...Object.values(BOT_COMMANDS).map((command) => command),
  ].join("\n");
}
