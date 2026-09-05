"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { agendaService } from "@/services/agenda.service";
import { mediaService } from "@/services/media.service";
import { createAgendaSchema, updateAgendaSchema } from "@/lib/validation/agenda.schema";
import { DomainError } from "@/types/domain-errors";
import { logger } from "@/lib/logger/logger";
import type { Agenda } from "@prisma/client";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createAgendaAction(
  _previousState: ActionResult<Agenda> | null,
  formData: FormData,
): Promise<ActionResult<Agenda>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Anda belum login" };
  }
  const raw = Object.fromEntries(formData.entries());
  const technicianIds = formData.getAll("technicianIds").map(String).filter(Boolean);
  const parsed = createAgendaSchema.safeParse({ ...raw, technicianIds });
  if (!parsed.success) {
    return { success: false, error: "Validasi gagal", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Database (Agenda.technicianId) cuma menampung SATU teknisi. Kalau checkbox
  // di form ada yang tercentang, itu yang dipakai sebagai penugasan tunggal.
  // technicianIds TETAP disertakan di payload (bukan dibuang) supaya cocok
  // dengan tipe CreateAgendaInput yang mewajibkannya (karena ada default([])).
  const technicianId = parsed.data.technicianIds[0] ?? parsed.data.technicianId ?? null;

  try {
    const agenda = await agendaService.create(session, { ...parsed.data, technicianId });

    const files = formData
      .getAll("attachment")
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length > 0) {
      const results = await Promise.allSettled(
        files.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          return mediaService.uploadToAgenda(session, agenda.id, {
            name: file.name,
            type: file.type,
            buffer,
          });
        }),
      );

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        logger.warn(
          { agendaId: agenda.id, failedCount: failed.length },
          "Sebagian lampiran gagal diunggah saat membuat agenda",
        );
      }
    }

    revalidatePath("/agenda");
    return { success: true, data: agenda };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Terjadi kesalahan pada server" };
  }
}

export async function updateAgendaAction(
  id: string,
  _previousState: ActionResult<Agenda> | null,
  formData: FormData,
): Promise<ActionResult<Agenda>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Anda belum login" };
  }
  const raw = Object.fromEntries(formData.entries());
  const technicianIds = formData.getAll("technicianIds").map(String).filter(Boolean);
  const parsed = updateAgendaSchema.safeParse({
    ...raw,
    ...(technicianIds.length > 0 ? { technicianIds } : {}),
  });
  if (!parsed.success) {
    return { success: false, error: "Validasi gagal", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const technicianId =
    parsed.data.technicianIds && parsed.data.technicianIds.length > 0
      ? parsed.data.technicianIds[0]
      : (parsed.data.technicianId ?? undefined);

  try {
    const agenda = await agendaService.update(session, id, {
      ...parsed.data,
      ...(technicianId !== undefined ? { technicianId } : {}),
    });
    revalidatePath("/agenda");
    revalidatePath(`/agenda/${id}`);
    return { success: true, data: agenda };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Terjadi kesalahan pada server" };
  }
}

export async function deleteAgendaAction(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Anda belum login" };
  }
  try {
    await agendaService.remove(session, id);
    revalidatePath("/agenda");
    return { success: true, data: { id } };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Terjadi kesalahan pada server" };
  }
}

export async function completeAgendaAction(id: string): Promise<ActionResult<Agenda>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Anda belum login" };
  }
  try {
    const agenda = await agendaService.markCompleted(session, id);
    revalidatePath("/agenda");
    revalidatePath(`/agenda/${id}`);
    return { success: true, data: agenda };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Terjadi kesalahan pada server" };
  }
}