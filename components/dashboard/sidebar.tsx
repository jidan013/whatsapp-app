"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  GalleryVerticalEnd,
  Search,
  Download,
  Database,
  HardDrive,
  Users,
  Bell,
  Settings,
  Briefcase,
  Plus,
  CircleCheck,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agenda", href: "/agenda", icon: ListTodo },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Gallery", href: "/gallery", icon: GalleryVerticalEnd },
  { label: "Search", href: "/search", icon: Search },
  { label: "Export", href: "/export", icon: Download },
  { label: "Backup", href: "/backup", icon: Database },
  { label: "Google Drive", href: "/drive", icon: HardDrive },
  { label: "Users", href: "/users", icon: Users },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-700">
          <Briefcase className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">WorkHub</p>
          <p className="truncate text-[11px] text-slate-500">WhatsApp Integrated</p>
        </div>
      </div>

      {/* Quick action */}
      <div className="px-3 pt-4">
        <Link
          href="/agenda/new"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Agenda Baru
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-700" : "text-slate-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-slate-100 px-3 py-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600">
          <CircleCheck className="h-4 w-4 text-emerald-500" />
          Terhubung
        </div>
        <Link
          href="/help"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <HelpCircle className="h-4 w-4 text-slate-400" />
          Bantuan
        </Link>
      </div>
    </aside>
  );
}