"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

interface FilterOptions {
  technicians: { id: string; name: string }[];
  statuses: { id: string; name: string }[];
  priorities: { id: string; name: string }[];
}

interface AgendaFilterBarProps {
  initialValues: {
    tanggal?: string;
    teknisi?: string;
    status?: string;
    prioritas?: string;
  };
  options: FilterOptions;
}

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-400";

export function AgendaFilterBar({ initialValues, options }: AgendaFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [tanggal, setTanggal] = useState<string>(initialValues.tanggal || "");
  const [teknisi, setTeknisi] = useState<string>(initialValues.teknisi || "all");
  const [status, setStatus] = useState<string>(initialValues.status || "all");
  const [prioritas, setPrioritas] = useState<string>(initialValues.prioritas || "all");

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (tanggal) params.set("tanggal", tanggal);
    else params.delete("tanggal");
    if (teknisi && teknisi !== "all") params.set("teknisi", teknisi);
    else params.delete("teknisi");
    if (status && status !== "all") params.set("status", status);
    else params.delete("status");
    if (prioritas && prioritas !== "all") params.set("prioritas", prioritas);
    else params.delete("prioritas");
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const resetFilters = () => {
    setTanggal("");
    setTeknisi("all");
    setStatus("all");
    setPrioritas("all");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tanggal");
    params.delete("teknisi");
    params.delete("status");
    params.delete("prioritas");
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <label className={labelClass}>Tanggal</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Teknisi</label>
          <select value={teknisi} onChange={(e) => setTeknisi(e.target.value)} className={fieldClass}>
            <option value="all">Semua Teknisi</option>
            {options.technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
            <option value="all">Semua Status</option>
            {options.statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Prioritas</label>
          <select value={prioritas} onChange={(e) => setPrioritas(e.target.value)} className={fieldClass}>
            <option value="all">Semua Prioritas</option>
            {options.priorities.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={resetFilters}
          disabled={isPending}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Reset
        </button>
        <button
          onClick={applyFilters}
          disabled={isPending}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-3.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {isPending ? "Menerapkan..." : "Terapkan"}
        </button>
      </div>
    </div>
  );
}