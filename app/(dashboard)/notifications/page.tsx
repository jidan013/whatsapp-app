import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { getUnifiedNotifications, countByCategory } from "@/lib/notifications/unified-feed";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const metadata: Metadata = { title: "Notifications" };

const DEFAULT_PREFERENCES = { push: true, whatsapp: true, emailDigest: false };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [items, prefSetting] = await Promise.all([
    getUnifiedNotifications(session.user.id),
    prisma.setting.findUnique({ where: { key: `notification-preference:${session.user.id}` } }),
  ]);

  const counts = countByCategory(items);
  const preferences = (prefSetting?.value as typeof DEFAULT_PREFERENCES | undefined) ?? DEFAULT_PREFERENCES;

  return (
    <NotificationCenter
      items={items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString(), sentAt: i.sentAt?.toISOString() ?? null, readAt: i.readAt?.toISOString() ?? null }))}
      counts={counts}
      initialPreferences={preferences}
    />
  );
}