"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";

type BackupType = "FULL" | "DATABASE_ONLY" | "FILES_ONLY";

const BACKUP_TYPE_LABEL: Record<BackupType, string> = {
  FULL: "Backup Penuh",
  DATABASE_ONLY: "Backup Database Saja",
  FILES_ONLY: "Backup File Saja",
};

export function BackupTriggerButtons() {
  const router = useRouter();
  const [loadingType, setLoadingType] = React.useState<BackupType | null>(null);

  async function handleBackup(type: BackupType) {
    setLoadingType(type);
    try {
      const response = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        const message = typeof body === "object" && body !== null && "error" in body ? String((body as { error: unknown }).error) : "Backup gagal";
        toast.error(message);
        return;
      }

      toast.success("Backup berhasil dijalankan");
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setLoadingType(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(BACKUP_TYPE_LABEL) as BackupType[]).map((type) => (
        <Button key={type} variant="outline" disabled={loadingType !== null} onClick={() => void handleBackup(type)}>
          <Database className="mr-2 h-4 w-4" />
          {loadingType === type ? "Memproses..." : BACKUP_TYPE_LABEL[type]}
        </Button>
      ))}
    </div>
  );
}
