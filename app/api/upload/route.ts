import type { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { mediaService } from "@/services/media.service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { UnauthorizedError, ValidationError } from "@/types/domain-errors";

const uploadFieldsSchema = z.object({
  agendaId: z.string().uuid("agendaId tidak valid"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const formData = await request.formData();
    const agendaId = formData.get("agendaId");
    const file = formData.get("file");

    const parsed = uploadFieldsSchema.parse({ agendaId });

    if (!(file instanceof File)) {
      throw new ValidationError("File tidak ditemukan pada request", { file: ["File wajib diunggah"] });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const media = await mediaService.uploadToAgenda(session, parsed.agendaId, {
      name: file.name,
      type: file.type,
      buffer,
    });

    return apiSuccess(media, 201);
  } catch (error) {
    return apiError(error);
  }
}
