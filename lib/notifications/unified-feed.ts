import "server-only";
import { prisma } from "@/lib/prisma";

export type NotificationCategory = "system" | "whatsapp" | "workorders" | "security";
export type NotificationSeverity = "critical" | "normal";

export interface UnifiedNotificationItem {
  id: string;
  kind: "notification" | "activity";
  title: string;
  message: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  isRead: boolean;
  createdAt: Date;
  sentAt: Date | null;
  readAt: Date | null;
  agendaId: string | null;
}

function categorizeActivity(action: string): { category: NotificationCategory; severity: NotificationSeverity } {
  if (action === "PERMISSION_DENIED") return { category: "security", severity: "critical" };
  if (action === "SYSTEM_ERROR" || action === "API_ERROR") return { category: "system", severity: "critical" };
  return { category: "system", severity: "normal" };
}

function categorizeNotification(
  channel: string,
  status: string,
  agendaId: string | null,
): { category: NotificationCategory; severity: NotificationSeverity } {
  const severity: NotificationSeverity = status === "FAILED" ? "critical" : "normal";
  if (channel === "WHATSAPP") return { category: "whatsapp", severity };
  if (agendaId) return { category: "workorders", severity };
  return { category: "system", severity };
}

export async function getUnifiedNotifications(userId: string): Promise<UnifiedNotificationItem[]> {
  const [notifications, activityLogs] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const fromNotifications: UnifiedNotificationItem[] = notifications.map((n) => {
    const { category, severity } = categorizeNotification(n.channel, n.status, n.agendaId);
    return {
      id: n.id,
      kind: "notification",
      title: n.title,
      message: n.message,
      category,
      severity,
      isRead: n.status === "READ",
      createdAt: n.createdAt,
      sentAt: n.sentAt,
      readAt: n.readAt,
      agendaId: n.agendaId,
    };
  });

  const fromActivity: UnifiedNotificationItem[] = activityLogs.map((a) => {
    const { category, severity } = categorizeActivity(a.action);
    return {
      id: a.id,
      kind: "activity",
      title: a.action.replaceAll("_", " "),
      message: a.description,
      category,
      severity,
      isRead: true, // Audit log dianggap selalu "terbaca", tidak ada konsep unread untuk log sistem
      createdAt: a.createdAt,
      sentAt: a.createdAt,
      readAt: a.createdAt,
      agendaId: a.entityType === "Agenda" ? (a.entityId ?? null) : null,
    };
  });

  return [...fromNotifications, ...fromActivity].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function countByCategory(items: UnifiedNotificationItem[]) {
  return {
    all: items.length,
    system: items.filter((i) => i.category === "system").length,
    whatsapp: items.filter((i) => i.category === "whatsapp").length,
    workorders: items.filter((i) => i.category === "workorders").length,
    security: items.filter((i) => i.category === "security").length,
  };
}