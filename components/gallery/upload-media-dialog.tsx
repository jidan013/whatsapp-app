"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud, Search, X, FileUp, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AgendaOption {
  id: string;
  title: string;
}

interface UploadMediaDialogProps {
  trigger?: React.ReactNode;
  triggerClassName?: string;
}

export function UploadMediaDialog({ trigger, triggerClassName }: UploadMediaDialogProps = {}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<AgendaOption[]>([]);
  const [selectedAgenda, setSelectedAgenda] = React.useState<AgendaOption | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  // Cari agenda secara real-time via endpoint /api/agenda yang sudah ada
  React.useEffect(() => {
    if (!open || query.trim().length < 2) {
      setOptions([]);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);

    const timeout = setTimeout(() => {
      fetch(`/api/agenda?search=${encodeURIComponent(query)}&limit=8`, { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => {
          const items = json?.data?.items ?? [];
          setOptions(items.map((item: { id: string; title: string }) => ({ id: item.id, title: item.title })));
        })
        .catch(() => undefined)
        .finally(() => setIsSearching(false));
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query, open]);

  function reset() {
    setQuery("");
    setOptions([]);
    setSelectedAgenda(null);
    setFile(null);
  }

  async function handleUpload() {
    if (!selectedAgenda) {
      toast.error("Pilih agenda tujuan terlebih dahulu");
      return;
    }
    if (!file) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("agendaId", selectedAgenda.id);
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok || json?.success === false) {
        toast.error(json?.error ?? "Gagal mengunggah file");
        return;
      }

      toast.success("File berhasil diunggah");
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan saat mengunggah file");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        className={
          triggerClassName ??
          "flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-blue-800"
        }
      >
        {trigger ?? (
          <>
            <UploadCloud className="h-4 w-4" />
            Upload
          </>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md border-gray-200 bg-white p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle>Unggah Media</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Agenda Tujuan</label>
            {selectedAgenda ? (
              <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
                <span className="truncate font-medium text-blue-900">{selectedAgenda.title}</span>
                <button onClick={() => setSelectedAgenda(null)} className="text-blue-400 hover:text-blue-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari judul agenda..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                {isSearching ? (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                ) : null}

                {options.length > 0 ? (
                  <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSelectedAgenda(option);
                          setOptions([]);
                          setQuery("");
                        }}
                        className="block w-full truncate px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50"
                      >
                        {option.title}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">File</label>
            <label
              htmlFor="upload-file-input"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center hover:border-blue-300 hover:bg-blue-50/40"
            >
              <FileUp className="h-5 w-5 text-slate-400" />
              <p className="text-sm text-slate-600">{file ? file.name : "Klik untuk pilih file"}</p>
              <p className="text-xs text-slate-400">Maks {process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB ?? 50}MB</p>
            </label>
            <input
              id="upload-file-input"
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <Button
            onClick={() => void handleUpload()}
            disabled={isUploading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white"
          >
            {isUploading ? "Mengunggah..." : "Unggah"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}