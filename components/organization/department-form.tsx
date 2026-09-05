"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDepartmentAction } from "@/server/actions/department.actions";
import type { ActionResult } from "@/server/actions/agenda.actions";
import type { Department } from "@prisma/client";

const initialState: ActionResult<Department> | null = null;

export function DepartmentForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createDepartmentAction, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state?.success) {
      toast.success(`Departemen "${state.data.name}" dibuat`);
      formRef.current?.reset();
      router.refresh();
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-3">
      <div className="flex-1 space-y-2">
        <Label htmlFor="name">Nama Departemen</Label>
        <Input id="name" name="name" required minLength={2} maxLength={100} />
      </div>
      <div className="flex-1 space-y-2">
        <Label htmlFor="description">Deskripsi (opsional)</Label>
        <Input id="description" name="description" maxLength={500} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Menyimpan..." : "Tambah"}
      </Button>
    </form>
  );
}
