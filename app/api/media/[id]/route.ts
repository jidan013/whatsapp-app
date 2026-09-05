import "server-only";
import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { mediaService } from "@/services/media.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { UnauthorizedError } from "@/types/domain-errors";

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
    // PENTING: media.localPath (dari storageDriver.save()) SUDAH berupa path
    // lengkap yang sudah menyertakan STORAGE_LOCAL_PATH di dalamnya. Jangan
    // gabungkan basePath lagi di sini, cukup resolve relatif ke cwd kalau
    // path-nya belum absolut.
    const filePath = path.isAbsolute(media.localPath)
      ? media.localPath
      : path.join(process.cwd(), media.localPath);

    const fileBuffer = await fs.readFile(filePath);

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

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const { id } = await params;
    await mediaService.remove(session, id);

    return apiSuccess({ id });
  } catch (error) {
    return apiError(error);
  }
}