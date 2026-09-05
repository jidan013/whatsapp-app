import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardList, MessageSquare, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyActivityChart } from "@/components/dashboard/weekly-activity-chart";

export const metadata: Metadata = { title: "Dashboard" };

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTrend(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { value: 100, up: true } : { value: 0, up: true };
  const change = Math.round(((current - previous) / previous) * 100);
  return { value: Math.abs(change), up: change >= 0 };
}

function relativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const today = startOfDay(new Date());
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    activeOrdersNow,
    activeOrdersPrevWeek,
    messagesToday,
    messagesPrevDay,
    escalationsNow,
    escalationsPrevWeek,
    weeklyAgenda,
    recentActivity,
  ] = await Promise.all([
    prisma.agenda.count({
      where: { deletedAt: null, status: { isTerminal: false } },
    }),
    prisma.agenda.count({
      where: {
        deletedAt: null,
        status: { isTerminal: false },
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
    prisma.notification.count({
      where: { channel: "WHATSAPP", createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.notification.count({
      where: {
        channel: "WHATSAPP",
        createdAt: { gte: new Date(today.getTime() - 86400000), lt: today },
      },
    }),
    prisma.agenda.count({
      where: { deletedAt: null, priority: "URGENT", status: { isTerminal: false } },
    }),
    prisma.agenda.count({
      where: {
        deletedAt: null,
        priority: "URGENT",
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
    prisma.agenda.findMany({
      where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const activeOrdersTrend = formatTrend(activeOrdersNow, activeOrdersPrevWeek);
  const messagesTrend = formatTrend(messagesToday, messagesPrevDay);
  const escalationsTrend = formatTrend(escalationsNow, escalationsPrevWeek);

  const chartData = DAY_LABELS.map((label, index) => {
    const dayDate = new Date(sevenDaysAgo);
    dayDate.setDate(dayDate.getDate() + index);
    const nextDay = new Date(dayDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const total = weeklyAgenda.filter((a) => a.createdAt >= dayDate && a.createdAt < nextDay).length;
    return { day: label, total };
  });

  const stats = [
    {
      label: "Agenda Aktif",
      value: activeOrdersNow,
      trend: activeOrdersTrend,
      icon: ClipboardList,
      accent: "bg-blue-50 text-blue-700",
    },
    {
      label: "Pesan Hari Ini",
      value: messagesToday,
      trend: messagesTrend,
      icon: MessageSquare,
      accent: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Eskalasi",
      value: escalationsNow,
      trend: escalationsTrend,
      icon: AlertTriangle,
      accent: "bg-red-50 text-red-700",
      invertColor: true,
    },
  ];

  const todayLabel = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date())
    .toUpperCase();

  const firstName = session.user.name?.split(" ")[0] ?? "Admin";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wide text-slate-400">{todayLabel}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Selamat Pagi, {firstName}.</h1>
        <p className="mt-1 text-sm text-slate-500">Inilah rangkuman operasional hari ini.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.invertColor ? !stat.trend.up : stat.trend.up;
          return (
            <Card key={stat.label} className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {stat.trend.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.trend.value}%
                  </span>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{stat.value.toLocaleString("id-ID")}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold text-slate-900">Volume Aktivitas</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyActivityChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold text-slate-900">Live Feed</CardTitle>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Belum ada aktivitas.</p>
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">
                      {log.description}
                      {log.user?.name ? (
                        <span className="font-medium text-slate-900"> — {log.user.name}</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{relativeTime(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
            <Link
              href="/activity-logs"
              className="block pt-1 text-center text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              Lihat Semua Aktivitas
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}