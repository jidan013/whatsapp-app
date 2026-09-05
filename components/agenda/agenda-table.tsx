"use client";

import { format, isBefore, startOfDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";
import { MoreVertical, MapPin } from "lucide-react";
import { PriorityBadge } from "@/components/agenda/priority-badge";
import { StatusBadge } from "@/components/agenda/status-badge";

type AgendaItem = {
  id: string;
  title: string;
  location: string | null;
  scheduledDate: Date;
  scheduledTime: string | null;
  priority: string;
  technician: {
    id: string;
    user: {
      id: string;
      name: string;
    };
  } | null;
  status: {
    id: string;
    name: string;
    colorHex: string;
    isTerminal: boolean;
  };
};

interface AgendaTableProps {
  items: AgendaItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function generateWOId(index: number, scheduledDate: Date): string {
  const year = scheduledDate.getFullYear();
  const padded = String(index).padStart(3, "0");
  return `#WO-${year}-${padded}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function avatarColorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? "bg-blue-100 text-blue-700";
}

export function AgendaTable({ items, pagination }: AgendaTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        Belum ada agenda. Klik &ldquo;Agenda Baru&rdquo; untuk membuat yang pertama.
      </div>
    );
  }

  const today = startOfDay(new Date());

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">ID WO</th>
              <th className="px-4 py-3">Judul &amp; Lokasi</th>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Teknisi</th>
              <th className="px-4 py-3">Prioritas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const startIndex = (pagination.page - 1) * pagination.limit;
              const woId = generateWOId(startIndex + index + 1, new Date(item.scheduledDate));
              const technicianName = item.technician?.user?.name ?? "-";
              const initials = technicianName !== "-" ? getInitials(technicianName) : "-";
              const isOverdue =
                !item.status.isTerminal && isBefore(new Date(item.scheduledDate), today);

              return (
                <tr
                  key={item.id}
                  className={cnRow(isOverdue)}
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium">
                    <Link href={`/agenda/${item.id}`} className="text-blue-700 hover:underline">
                      {woId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/agenda/${item.id}`} className="block hover:underline">
                      <div className={isOverdue ? "font-semibold text-red-700" : "font-semibold text-slate-900"}>
                        {item.title}
                      </div>
                      {item.location ? (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </div>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className={isOverdue ? "text-sm font-medium text-red-700" : "text-sm font-medium text-slate-700"}>
                        {format(new Date(item.scheduledDate), "dd MMM yyyy", { locale: localeId })}
                      </span>
                      {item.scheduledTime ? (
                        <span className="text-xs text-slate-400">{item.scheduledTime}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${avatarColorFor(technicianName)}`}
                      >
                        {initials}
                      </div>
                      <span className="text-sm text-slate-700">{technicianName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={item.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/agenda/${item.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Lihat detail"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div className="text-sm text-slate-500">
          Menampilkan {(pagination.page - 1) * pagination.limit + 1}-
          {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} agenda
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("page", String(pagination.page - 1));
              window.location.href = `/agenda?${params.toString()}`;
            }}
            disabled={pagination.page <= 1}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("page", String(pagination.page + 1));
              window.location.href = `/agenda?${params.toString()}`;
            }}
            disabled={pagination.page >= pagination.totalPages}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}

function cnRow(isOverdue: boolean) {
  return isOverdue ? "bg-red-50/60 hover:bg-red-50" : "hover:bg-slate-50";
}