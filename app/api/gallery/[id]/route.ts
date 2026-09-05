import "server-only";
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const media = await prisma.agendaMedia.findUnique({
    where: { id, deletedAt: null },
  });

  if (!media || !media.localPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const fileBuffer = await fs.readFile(media.localPath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": media.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(media.originalName)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }
}