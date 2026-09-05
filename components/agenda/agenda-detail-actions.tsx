"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { completeAgendaAction, deleteAgendaAction } from "@/server/actions/agenda.actions";

export function AgendaDetailActions({
  agendaId,
  isTerminalStatus,
}: {
  agendaId: string;
  isTerminalStatus: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function handleComplete() {
    startTransition(async () => {
      const result = await completeAgendaAction(agendaId);
      if (result.success) {
        toast.success("Agenda ditandai selesai");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Hapus agenda ini? Tindakan ini bisa dipulihkan lewat database (soft delete).")) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAgendaAction(agendaId);
      if (result.success) {
        toast.success("Agenda dihapus");
        router.push("/agenda");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aksi</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {!isTerminalStatus && (
          <Button onClick={handleComplete} disabled={isPending} className="w-full">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Tandai Selesai
          </Button>
        )}
        <Button
          onClick={handleDelete}
          disabled={isPending}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus Agenda
        </Button>
      </CardContent>
    </Card>
  );
}