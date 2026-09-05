"use client";

import * as React from "react";
import Link from "next/link";
import { Filter, MapPin, AlertCircle } from "lucide-react";
import { PriorityBadge } from "@/components/agenda/priority-badge";

interface UnassignedTask {
  id: string;
  code: string;
  title: string;
  location: string | null;
  priority: string;
}

export function UnassignedTaskList({ tasks }: { tasks: UnassignedTask[] }) {
  const [query, setQuery] = React.useState("");

  const filtered = tasks.filter((task) =>
    `${task.title} ${task.location ?? ""} ${task.code}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter pekerjaan..."
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Tidak ada pekerjaan yang cocok.</p>
        ) : (
          filtered.map((task) => (
            <Link
              key={task.id}
              href={`/agenda/${task.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="flex items-center justify-between gap-2">
                <PriorityBadge priority={task.priority} />
                <span className="font-mono text-xs font-medium text-slate-400">{task.code}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{task.title}</p>
              {task.location ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" />
                  {task.location}
                </p>
              ) : (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3" />
                  Lokasi belum diisi
                </p>
              )}
            </Link>
          ))
        )}
      </div>

      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-6 text-center">
        <AlertCircle className="mx-auto h-5 w-5 text-slate-300" />
        <p className="mt-2 text-sm text-slate-400">
          Klik pekerjaan di atas untuk melengkapi data teknisi yang mengerjakan.
        </p>
      </div>
    </div>
  );
}