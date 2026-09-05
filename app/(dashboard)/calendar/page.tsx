import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils/cn";
import { UnassignedTaskList } from "@/components/calendar/unassigned-task-list";

export const metadata: Metadata = { title: "Kalender Pekerjaan" };

interface CalendarPageProps {
  searchParams: Promise<{ month?: string }>;
}

const WEEKDAY_LABELS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function monthParam(date: Date) {
  return format(date, "yyyy-MM");
}

function codeFor(id: string) {
  return `WO-${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const referenceDate = params.month ? new Date(`${params.month}-01`) : new Date();
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);

  const [agendaInMonth, unassignedAgenda] = await Promise.all([
    prisma.agenda.findMany({
      where: { deletedAt: null, scheduledDate: { gte: monthStart, lte: monthEnd } },
      include: { status: true },
      orderBy: { scheduledDate: "asc" },
    }),
    prisma.agenda.findMany({
      where: { deletedAt: null, technicianId: null, status: { isTerminal: false } },
      orderBy: { priority: "desc" },
      take: 20,
    }),
  ]);

  const agendaByDate = new Map<string, typeof agendaInMonth>();
  for (const agenda of agendaInMonth) {
    const key = format(new Date(agenda.scheduledDate), "yyyy-MM-dd");
    const existing = agendaByDate.get(key) ?? [];
    existing.push(agenda);
    agendaByDate.set(key, existing);
  }

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Senin = 0 ... Minggu = 6 (date-fns getDay default: Minggu = 0)
  const leadingBlanks = (getDay(monthStart) + 6) % 7;
  const trailingBlanks = (7 - ((leadingBlanks + days.length) % 7)) % 7;

  const prevMonthHref = `/calendar?month=${monthParam(subMonths(referenceDate, 1))}`;
  const nextMonthHref = `/calendar?month=${monthParam(addMonths(referenceDate, 1))}`;
  const todayHref = `/calendar?month=${monthParam(new Date())}`;

  const unassignedTasks = unassignedAgenda.map((agenda) => ({
    id: agenda.id,
    code: codeFor(agenda.id),
    title: agenda.title,
    location: agenda.location,
    priority: agenda.priority,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {format(monthStart, "MMMM yyyy", { locale: localeId })}
            </h1>
            <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
              <Link
                href={prevMonthHref}
                className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <Link
                href={todayHref}
                className="border-x border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Hari Ini
              </Link>
              <Link
                href={nextMonthHref}
                className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 text-sm">
              <span className="bg-slate-100 px-3 py-1.5 font-medium text-slate-700">Bulan</span>
              <span className="px-3 py-1.5 text-slate-400" title="Belum tersedia">
                Minggu
              </span>
              <span className="px-3 py-1.5 text-slate-400" title="Belum tersedia">
                Hari
              </span>
            </div>
            <Link
              href="/agenda/new"
              className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Catat Pekerjaan
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`lead-${i}`} className="min-h-28 border-b border-r border-slate-100 bg-slate-50/50" />
            ))}

            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayAgenda = agendaByDate.get(key) ?? [];
              const todayCell = isToday(day);
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-28 border-b border-r border-slate-100 p-2",
                    !isSameMonth(day, referenceDate) && "opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-slate-600",
                      todayCell && "bg-blue-700 text-white",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1.5 space-y-1">
                    {dayAgenda.slice(0, 2).map((agenda) => (
                      <Link
                        key={agenda.id}
                        href={`/agenda/${agenda.id}`}
                        className="block truncate rounded-md px-1.5 py-1 text-[11px] font-medium text-white"
                        style={{ backgroundColor: agenda.status.colorHex || "#64748b" }}
                        title={agenda.title}
                      >
                        {agenda.scheduledTime ? `${agenda.scheduledTime} - ` : ""}
                        {agenda.title}
                      </Link>
                    ))}
                    {dayAgenda.length > 2 ? (
                      <p className="px-1 text-[11px] text-slate-400">+{dayAgenda.length - 2} lainnya</p>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {Array.from({ length: trailingBlanks }).map((_, i) => (
              <div key={`trail-${i}`} className="min-h-28 border-b border-r border-slate-100 bg-slate-50/50" />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Pekerjaan Tanpa Teknisi</h2>
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-700">
            {unassignedTasks.length}
          </span>
        </div>
        <p className="text-xs text-slate-400">Catatan pekerjaan yang belum ada teknisi tercatat.</p>
        <UnassignedTaskList tasks={unassignedTasks} />
      </div>
    </div>
  );
}