"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  createCommentAction,
  deleteCommentAction,
} from "@/server/actions/comment.actions";
import type { ActionResult } from "@/server/actions/agenda.actions";
import type { Comment } from "@prisma/client";

interface CommentFormProps {
  agendaId: string;
  currentUserId: string;
  isAdmin: boolean;
  comments: (Comment & { user: { id: string; name: string } })[];
}

const initialState: ActionResult<Comment> | null = null;

export function CommentForm({
  agendaId,
  currentUserId,
  isAdmin,
  comments,
}: CommentFormProps) {
  const router = useRouter();
  const boundAction = createCommentAction.bind(null, agendaId);
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );
  const formRef = React.useRef<HTMLFormElement>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state, router]);

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    try {
      const result = await deleteCommentAction(agendaId, commentId);
      if (result.success) {
        toast.success("Komentar dihapus");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex items-start justify-between rounded border p-3 text-sm"
          >
            <div>
              <p className="font-medium">{comment.user.name}</p>
              <p className="text-muted-foreground">{comment.content}</p>
            </div>
            {(comment.user.id === currentUserId || isAdmin) && (
              <Button
                variant="ghost"
                size="icon"
                disabled={deletingId === comment.id}
                onClick={() => void handleDelete(comment.id)}
                aria-label="Hapus komentar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <form ref={formRef} action={formAction} className="flex gap-2">
        <Textarea
          name="content"
          placeholder="Tulis komentar..."
          rows={2}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={isPending}>
          Kirim
        </Button>
      </form>
    </div>
  );
}
