"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Webhook, MessageSquareCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface BotCommandForm {
  command: string;
  description: string;
  example: string;
}

interface BotConfigEditorProps {
  initialCommands: { command: string; description: string; example?: string }[];
  initialWebhookUrl: string;
  trigger?: React.ReactNode;
}

export function BotConfigEditor({ initialCommands, initialWebhookUrl, trigger }: BotConfigEditorProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [commands, setCommands] = React.useState<BotCommandForm[]>(
    initialCommands.map((c) => ({
      command: c.command,
      description: c.description,
      example: c.example ?? "",
    }))
  );
  const [webhookUrl, setWebhookUrl] = React.useState(initialWebhookUrl);

  function addCommand() {
    setCommands((prev) => [...prev, { command: "", description: "", example: "" }]);
  }

  function removeCommand(index: number) {
    setCommands((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCommand(index: number, field: keyof BotCommandForm, value: string) {
    setCommands((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  async function handleSave() {
    if (commands.length === 0) {
      toast.error("Minimal 1 bot command");
      return;
    }
    if (commands.some((c) => !c.command.trim() || !c.description.trim())) {
      toast.error("Command dan deskripsi tidak boleh kosong");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/bot-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botCommands: commands.map((c) => ({
            command: c.command.trim(),
            description: c.description.trim(),
            ...(c.example.trim() ? { example: c.example.trim() } : {}),
          })),
          webhookUrl: webhookUrl.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        toast.error(json?.error ?? "Gagal menyimpan konfigurasi");
        return;
      }
      toast.success("Konfigurasi bot berhasil disimpan");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Menghapus DialogTrigger dan menggunakan onClick standard */}
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer inline-block">
          {trigger}
        </div>
      ) : (
        <button 
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Configurations
        </button>
      )}

      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto border-slate-200 bg-white sm:rounded-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Edit Configurations
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Manage your automated bot commands and webhook endpoints.
          </p>
        </DialogHeader>

        <div className="space-y-8">
          {/* Bot Commands Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <MessageSquareCode className="h-4 w-4" />
              <Label className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                Bot Commands
              </Label>
            </div>

            <div className="space-y-4">
              {commands.map((cmd, index) => (
                <div
                  key={index}
                  className="relative space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition-colors focus-within:border-indigo-300 focus-within:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Command #{index + 1}
                    </span>
                    <button
                      onClick={() => removeCommand(index)}
                      className="text-slate-400 transition-colors hover:text-red-500"
                      aria-label="Hapus command"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid gap-1.5">
                      <Label className="text-xs text-slate-600">Trigger Command</Label>
                      <Input
                        value={cmd.command}
                        onChange={(e) => updateCommand(index, "command", e.target.value)}
                        placeholder="#agenda [date]"
                        className="border-slate-200 font-mono text-sm focus-visible:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="grid gap-1.5">
                      <Label className="text-xs text-slate-600">Description</Label>
                      <Textarea
                        value={cmd.description}
                        onChange={(e) => updateCommand(index, "description", e.target.value)}
                        placeholder="Deskripsi fungsi command ini..."
                        rows={2}
                        className="resize-none border-slate-200 text-sm focus-visible:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="grid gap-1.5">
                      <Label className="text-xs text-slate-600">Example (Optional)</Label>
                      <Input
                        value={cmd.example}
                        onChange={(e) => updateCommand(index, "example", e.target.value)}
                        placeholder="Contoh: #agenda besok"
                        className="border-slate-200 text-sm focus-visible:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addCommand}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            >
              <Plus className="h-4 w-4" />
              Add New Command
            </button>
          </div>

          <Separator className="bg-slate-100" />

          {/* Webhook Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <Webhook className="h-4 w-4" />
              <Label htmlFor="webhook-url" className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                Custom Webhook URL
              </Label>
            </div>
            
            <div className="grid gap-1.5">
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                className="border-slate-200 font-mono text-sm focus-visible:ring-indigo-500"
              />
              <p className="text-xs text-slate-500">
                Endpoint listener to trigger external workflows when messages are received.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {isSaving ? "Saving changes..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}