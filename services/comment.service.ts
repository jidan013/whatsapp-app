import "server-only";
import { commentRepository } from "@/repositories/comment.repository";
import { agendaRepository } from "@/repositories/agenda.repository";
import { activityLogRepository } from "@/repositories/activity-log.repository";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { NotFoundError, ForbiddenError } from "@/types/domain-errors";
import type { Session } from "next-auth";

export const commentService = {
  async create(session: Session, agendaId: string, content: string) {
    assertPermission(session, PERMISSIONS.COMMENT_CREATE);

    const agenda = await agendaRepository.findById(agendaId);
    if (!agenda) {
      throw new NotFoundError("Agenda", agendaId);
    }

    const comment = await commentRepository.create(agendaId, session.user.id, content);

    await activityLogRepository.record({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Comment",
      entityId: comment.id,
      description: `Menambahkan komentar pada agenda "${agenda.title}"`,
    });

    return comment;
  },

  async remove(session: Session, commentId: string) {
    assertPermission(session, PERMISSIONS.COMMENT_DELETE);

    const comment = await commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError("Comment", commentId);
    }

    if (comment.userId !== session.user.id && !session.user.roles.includes("ADMIN")) {
      throw new ForbiddenError("Anda hanya bisa menghapus komentar milik sendiri");
    }

    await commentRepository.softDelete(commentId);

    await activityLogRepository.record({
      userId: session.user.id,
      action: "DELETE",
      entityType: "Comment",
      entityId: commentId,
      description: "Menghapus komentar",
    });
  },
};
