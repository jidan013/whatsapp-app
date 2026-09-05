"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Sheet, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportFormat = "pdf" | "excel" | "csv";

const FORMAT_CONFIG: Record<
  ExportFormat,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; borderColor: string }
> = {
  pdf: {
    label: "PDF",
    icon: FileText,
    color: "bg-red-50 text-red-700 hover:bg-red-100",
    borderColor: "border-red-200 hover:border-red-300",
  },
  excel: {
    label: "Excel",
    icon: Sheet,
    color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    borderColor: "border-emerald-200 hover:border-emerald-300",
  },
  csv: {
    label: "CSV",
    icon: FileSpreadsheet,
    color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    borderColor: "border-blue-200 hover:border-blue-300",
  },
};

export function ExportTriggerButtons() {
  const router = useRouter();
  const [loadingFormat, setLoadingFormat] = React.useState<ExportFormat | null>(null);

  function handleExport(format: ExportFormat) {
    setLoadingFormat(format);
    fetch(`/api/export/${format}`, { method: "POST" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) {
          const message = body?.error || "Export gagal";
          toast.error(message);
          return;
        }
        toast.success(`Export ${format.toUpperCase()} berhasil dibuat`);
        router.refresh();
      })
      .catch(() => {
        toast.error("Gagal menghubungi server");
      })
      .finally(() => {
        setLoadingFormat(null);
      });
  }

  return (
    <div className="flex flex-wrap gap-3">
      {(Object.keys(FORMAT_CONFIG) as ExportFormat[]).map((format) => {
        const { label, icon: Icon, color, borderColor } = FORMAT_CONFIG[format];
        const isLoading = loadingFormat === format;

        return (
          <Button
            key={format}
            variant="outline"
            disabled={loadingFormat !== null}
            onClick={() => handleExport(format)}
            className={`group relative flex h-auto min-w-[130px] items-center gap-2.5 border-2 px-5 py-3 text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${color} ${borderColor}`}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
            )}
            <span className="text-sm font-medium">{isLoading ? "Memproses..." : label}</span>
          </Button>
        );
      })}
    </div>
  );
}