"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { commentService } from "@/services/comment.service";
import { createCommentSchema } from "@/lib/validation/comment.schema";
import { DomainError } from "@/types/domain-errors";
import type { ActionResult } from "@/server/actions/agenda.actions";
import type { Comment } from "@prisma/client";

export async function createCommentAction(
  agendaId: string,
  _previousState: ActionResult<Comment> | null,
  formData: FormData,
): Promise<ActionResult<Comment>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Anda belum login" };
  }

  const parsed = createCommentSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { success: false, error: "Validasi gagal", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const comment = await commentService.create(session, agendaId, parsed.data.content);
    revalidatePath(`/agenda/${agendaId}`);
    return { success: true, data: comment };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Terjadi kesalahan pada server" };
  }
}

export async function deleteCommentAction(agendaId: string, commentId: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Anda belum login" };
  }

  try {
    await commentService.remove(session, commentId);
    revalidatePath(`/agenda/${agendaId}`);
    return { success: true, data: { id: commentId } };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Terjadi kesalahan pada server" };
  }
}
