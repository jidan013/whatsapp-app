"use client";

import Link from "next/link";
import { LogOut,Search, Bell, Plus } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import type { AppSessionUser } from "@/types/next-auth";

export function Topbar({ user }: { user: AppSessionUser }) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
        <span className="font-medium text-slate-900">WorkHub</span>
        <span className="text-slate-300">/</span>
        <span>Dashboard</span>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="relative hidden max-w-sm flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Cari agenda, teknisi..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-14 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            Ctrl K
          </kbd>
        </div>

        <Link
          href="/notifications"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          aria-label="Notifikasi"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
        </Link>


        <Link
          href="/agenda/new"
          className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-800 sm:flex"
        >
          <Plus className="h-4 w-4" />
          Agenda Baru
        </Link>

        <div className="flex shrink-0 items-center gap-2 border-l border-slate-200 pl-3">
          <div className="hidden text-right text-sm leading-tight md:block">
            <p className="font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.roles.join(", ")}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
            {initials}
          </div>
          <Button variant="ghost" size="icon" aria-label="Keluar" onClick={() => void signOut({ callbackUrl: "/login" })}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}