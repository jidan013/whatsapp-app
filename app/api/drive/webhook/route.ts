import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger/logger";
import { activityLogRepository } from "@/repositories/activity-log.repository";

/**
 * Google Drive push notifications tidak mengirim body JSON - informasi ada di header.
 * Referensi: https://developers.google.com/drive/api/guides/push
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const channelToken = request.headers.get("x-goog-channel-token");
  const resourceState = request.headers.get("x-goog-resource-state");
  const channelId = request.headers.get("x-goog-channel-id");

  const expectedToken = process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN;
  if (expectedToken && channelToken !== expectedToken) {
    logger.warn({ channelId }, "Google Drive webhook: token tidak valid, request ditolak");
    return NextResponse.json({ success: false }, { status: 401 });
  }

  logger.info({ channelId, resourceState }, "Google Drive webhook diterima");

  await activityLogRepository.record({
    action: "GOOGLE_DRIVE_SYNC",
    description: `Webhook Google Drive diterima: ${resourceState ?? "unknown"} (channel: ${channelId ?? "unknown"})`,
  });

  // Google mengharuskan respons 200 secepat mungkin (di bawah beberapa detik).
  // Pemrosesan detail (mis. menandai file sebagai berubah) sebaiknya di-queue,
  // bukan dilakukan sinkron di sini.
  return NextResponse.json({ success: true }, { status: 200 });
}
