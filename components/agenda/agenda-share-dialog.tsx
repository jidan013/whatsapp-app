"use client";
import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { QrCode, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
interface AgendaShareDialogProps {
  agendaId: string;
}
export function AgendaShareDialog({ agendaId }: AgendaShareDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [qrData, setQrData] = React.useState<{
    dataUrl: string;
    shareUrl: string;
  } | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);
  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (open && !qrData) {
      setIsLoading(true);
      fetch(`/api/agenda/${agendaId}/qrcode`)
        .then(async (response) => {
          const body = await response.json();
          if (response.ok && body.success) {
            setQrData(body.data);
          } else {
            toast.error("Gagal membuat QR code");
          }
        })
        .catch(() => {
          toast.error("Gagal menghubungi server");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }
  function handleCopy() {
    if (!qrData) return;
    navigator.clipboard
      .writeText(qrData.shareUrl)
      .then(() => {
        setIsCopied(true);
        toast.success("Link disalin");
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(() => {
        toast.error("Gagal menyalin link");
      });
  }
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" className="w-full" />}>
        <QrCode className="h-4 w-4" />
        Share / QR Code
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bagikan Agenda</DialogTitle>
          <DialogDescription>
            Scan QR code atau salin link untuk membuka agenda ini langsung.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">
            Membuat QR code...
          </p>
        ) : qrData ? (
          <div className="flex flex-col items-center gap-4">
            <Image
              src={qrData.dataUrl}
              alt="QR code agenda"
              width={220}
              height={220}
              unoptimized
            />
            <div className="flex w-full gap-2">
              <Input readOnly value={qrData.shareUrl} className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
