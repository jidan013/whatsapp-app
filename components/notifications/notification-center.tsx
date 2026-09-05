"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Inbox,
  Server,
  MessageSquare,
  Wrench,
  ShieldAlert,
  CheckCheck,
  Trash2,
  Reply,
  Send,
  Link2,
} from "lucide-react";

interface UnifiedItem {
  id: string;
  kind: "notification" | "activity";
  title: string;
  message: string;
  category: "system" | "whatsapp" | "workorders" | "security";
  severity: "critical" | "normal";
  isRead: boolean;
  createdAt: string;
  sentAt: string | null;
  readAt: string | null;
  agendaId: string | null;
}

interface Preferences {
  push: boolean;
  whatsapp: boolean;
  emailDigest: boolean;
}

interface NotificationCenterProps {
  items: UnifiedItem[];
  counts: {
    all: number;
    system: number;
    whatsapp: number;
    workorders: number;
    security: number;
  };
  initialPreferences: Preferences;
}

const CATEGORY_META = {
  all: { label: "All Notifications", icon: Inbox },
  system: { label: "System", icon: Server },
  whatsapp: { label: "WhatsApp", icon: MessageSquare },
  workorders: { label: "Work Orders", icon: Wrench },
  security: { label: "Security", icon: ShieldAlert },
} as const;

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j lalu`;
  return `${Math.floor(hours / 24)}h lalu`;
}

export function NotificationCenter({
  items,
  counts,
  initialPreferences,
}: NotificationCenterProps) {
  const router = useRouter();
  const [category, setCategory] =
    React.useState<keyof typeof CATEGORY_META>("all");
  const [tab, setTab] = React.useState<"all" | "unread" | "priority">("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [preferences, setPreferences] = React.useState(initialPreferences);
  const [replyText, setReplyText] = React.useState("");
  const [isSendingReply, setIsSendingReply] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // ===== PERBAIKAN: state lokal untuk items =====
  const [localItems, setLocalItems] = React.useState(items);

  // Sinkronkan ulang saat server mengirim data baru
  // (misal setelah router.refresh() dari aksi lain)
  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Pakai localItems, bukan items
  const filtered = localItems.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (tab === "unread" && item.isRead) return false;
    if (tab === "priority" && item.severity !== "critical") return false;
    return true;
  });

  const selected = localItems.find((i) => i.id === selectedId) ?? null;

  async function handleMarkAllRead() {
    const res = await fetch("/api/notifications/mark-all-read", {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Semua notifikasi ditandai terbaca");
      router.refresh();
    } else {
      toast.error("Gagal menandai notifikasi");
    }
  }

  async function handleClearHistory() {
    if (
      !confirm(
        "Hapus semua riwayat notifikasi? Log aktivitas sistem/keamanan tidak akan terhapus.",
      )
    )
      return;
    const res = await fetch("/api/notifications/clear", { method: "POST" });
    if (res.ok) {
      toast.success("Riwayat notifikasi dihapus");
      // ===== PERBAIKAN: kosongkan state lokal juga =====
      setLocalItems((prev) => prev.filter((i) => i.kind !== "notification"));
      setSelectedId(null);
      router.refresh();
    } else {
      toast.error("Gagal menghapus riwayat");
    }
  }

  async function handleSelectItem(item: UnifiedItem) {
    setSelectedId(item.id);
    if (item.kind === "notification" && !item.isRead) {
      await fetch(`/api/notifications/${item.id}/read`, { method: "POST" });
      router.refresh();
    }
  }

  async function handlePreferenceChange(
    key: keyof Preferences,
    value: boolean,
  ) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    const res = await fetch("/api/notifications/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!res.ok) {
      toast.error("Gagal menyimpan preferensi");
      setPreferences(preferences);
    }
  }

  async function handleSendReply() {
    if (!selected || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      const res = await fetch("/api/whatsapp/send-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId: selected.id,
          message: replyText,
        }),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        toast.error(
          json?.error ?? "Bot belum terhubung untuk mengirim balasan WhatsApp",
        );
        return;
      }
      toast.success("Balasan terkirim");
      setReplyText("");
    } catch {
      toast.error("Terjadi kesalahan saat mengirim balasan");
    } finally {
      setIsSendingReply(false);
    }
  }

  // ===== PERBAIKAN UTAMA: hapus langsung dari state lokal (optimistic update) =====
  async function handleDeleteItem(item: UnifiedItem) {
    if (item.kind !== "notification") return;
    if (!confirm("Hapus notifikasi ini?")) return;

    // Simpan kondisi sebelumnya untuk rollback jika API gagal
    const previousItems = localItems;
    setDeletingId(item.id);

    // Hapus langsung dari UI tanpa menunggu response
    setLocalItems((prev) => prev.filter((i) => i.id !== item.id));
    if (selectedId === item.id) setSelectedId(null);

    try {
      const res = await fetch(`/api/notifications/${item.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Notifikasi dihapus");
        router.refresh();
      } else {
        // Rollback jika server menolak
        setLocalItems(previousItems);
        toast.error("Gagal menghapus notifikasi");
      }
    } catch {
      // Rollback jika network error
      setLocalItems(previousItems);
      toast.error("Terjadi kesalahan");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Notification Center
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola alert dari System, WhatsApp, dan Work Orders.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void handleMarkAllRead()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
          <button
            onClick={() => void handleClearHistory()}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_1fr_360px]">
        {/* Kolom kiri: Categories + Channel Preferences */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Categories
            </h2>
            <div className="space-y-1">
              {(
                Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]
              ).map((key) => {
                const meta = CATEGORY_META[key];
                const Icon = meta.icon;
                const isActive = category === key;
                return (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {meta.label}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isActive
                          ? "bg-blue-700 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {counts[key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Channel Preferences
            </h2>
            <div className="space-y-3">
              {[
                {
                  key: "push" as const,
                  label: "Push Notifications",
                  desc: "Desktop alerts",
                },
                {
                  key: "whatsapp" as const,
                  label: "WhatsApp",
                  desc: "Direct messages",
                },
                {
                  key: "emailDigest" as const,
                  label: "Email Digest",
                  desc: "Daily summary",
                },
              ].map((pref) => (
                <div
                  key={pref.key}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {pref.label}
                    </p>
                    <p className="text-xs text-slate-400">{pref.desc}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={preferences[pref.key]}
                    onClick={() =>
                      void handlePreferenceChange(
                        pref.key,
                        !preferences[pref.key],
                      )
                    }
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      preferences[pref.key] ? "bg-blue-700" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        preferences[pref.key]
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom tengah: list notifikasi */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-1 border-b border-slate-200 px-3 py-2">
            {(["all", "unread", "priority"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                  tab === t
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">
                Tidak ada notifikasi.
              </p>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className={`group relative border-b border-slate-100 last:border-0 ${
                    selectedId === item.id
                      ? "bg-blue-50/60"
                      : "hover:bg-slate-50"
                  } ${item.severity === "critical" ? "border-l-4 border-l-red-500" : !item.isRead ? "border-l-4 border-l-blue-600" : ""}`}
                >
                  <button
                    onClick={() => void handleSelectItem(item)}
                    className="block w-full p-4 pr-10 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm ${item.isRead ? "font-medium" : "font-semibold"} text-slate-900`}
                      >
                        {item.title}
                      </p>
                      <span className="shrink-0 text-xs text-slate-400">
                        {relativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {item.message}
                    </p>
                    <div className="mt-2 flex gap-1.5">
                      {item.severity === "critical" ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                          Critical
                        </span>
                      ) : null}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {CATEGORY_META[item.category].label}
                      </span>
                    </div>
                  </button>
                  {item.kind === "notification" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteItem(item);
                      }}
                      disabled={deletingId === item.id}
                      aria-label="Hapus notifikasi"
                      className="absolute right-3 top-4 rounded-md p-1.5 text-slate-300 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom kanan: detail */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Message Details
          </h2>
          {!selected ? (
            <p className="py-10 text-center text-sm text-slate-400">
              Pilih notifikasi untuk melihat detail.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {selected.title}
                  </p>
                  {selected.kind === "notification" ? (
                    <button
                      onClick={() => void handleDeleteItem(selected)}
                      disabled={deletingId === selected.id}
                      aria-label="Hapus notifikasi"
                      className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {CATEGORY_META[selected.category].label} ·{" "}
                  {new Date(selected.createdAt).toLocaleString("id-ID")}
                </p>
              </div>

              {selected.kind === "notification" ? (
                <div className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                  <span>
                    Sent{" "}
                    {selected.sentAt
                      ? new Date(selected.sentAt).toLocaleTimeString("id-ID")
                      : "-"}
                  </span>
                  <span
                    className={
                      selected.readAt ? "text-blue-600" : "text-slate-400"
                    }
                  >
                    Read{" "}
                    {selected.readAt
                      ? new Date(selected.readAt).toLocaleTimeString("id-ID")
                      : "belum dibaca"}
                  </span>
                </div>
              ) : null}

              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                {selected.message}
              </div>

              {selected.agendaId ? (
                <a
                  href={`/agenda/${selected.agendaId}`}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50"
                >
                  <Link2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    Lihat Work Order Terkait
                  </span>
                </a>
              ) : null}

              {selected.category === "whatsapp" ? (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <p className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Reply className="h-3 w-3" />
                    Balas via WhatsApp (memerlukan bot terhubung)
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Tulis balasan..."
                      className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      onClick={() => void handleSendReply()}
                      disabled={isSendingReply || !replyText.trim()}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}