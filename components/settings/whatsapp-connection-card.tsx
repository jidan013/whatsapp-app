"use client";

import * as React from "react";
import { toast } from "sonner";
import { Phone, QrCode, Link2, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BotStatus {
  connected: boolean;
  phoneNumber: string | null;
  lastPingAt: string | null;
}

function formatPhoneNumber(raw: string | null): string {
  if (!raw) return "-";
  return `+${raw}`;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "-";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} jam lalu`;
}

export function WhatsAppConnectionCard({ initialStatus }: { initialStatus: BotStatus }) {
  const [status, setStatus] = React.useState(initialStatus);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/whatsapp/status")
        .then((res) => res.json())
        .then((json) => {
          if (json?.success) setStatus(json.data);
        })
        .catch(() => undefined);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleDisconnect() {
    if (!confirm("Putuskan koneksi WhatsApp? Perangkat perlu scan QR ulang untuk terhubung kembali.")) return;
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        toast.error(json?.error ?? json?.data?.error ?? "Gagal memutuskan koneksi");
        return;
      }
      toast.success("Koneksi WhatsApp diputuskan");
      setStatus({ connected: false, phoneNumber: null, lastPingAt: null });
      setQrDataUrl(null);
    } catch {
      toast.error("Tidak dapat menghubungi bot");
    } finally {
      setIsDisconnecting(false);
    }
  }

  async function fetchQrCode(): Promise<boolean> {
    setIsLoadingQr(true);
    try {
      const res = await fetch("/api/whatsapp/qrcode");
      const json = await res.json();
      if (json?.success && json.data?.qr) {
        setQrDataUrl(json.data.qr);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoadingQr(false);
    }
  }

  async function handleRevealOrGenerateQr() {
    if (qrDataUrl) {
      setQrDataUrl(null);
      return;
    }
    const success = await fetchQrCode();
    if (!success) {
      toast.error("QR code belum tersedia. Klik 'Generate New QR Code' terlebih dahulu.");
    }
  }

  async function handleGenerateNewQr() {
    setIsGenerating(true);
    setQrDataUrl(null);
    try {
      const res = await fetch("/api/whatsapp/reconnect", { method: "POST" });
      const json = await res.json();
      if (!res.ok || json?.success === false) {  
        toast.error(json?.error ?? json?.data?.error ?? "Gagal memulai sesi pairing baru");
        return;
      }
      toast.success("Sesi pairing baru dimulai. Mengambil QR code otomatis...");

      let attempts = 0;
      const intervalId = setInterval(() => {
        void (async () => {
          attempts++;
          const found = await fetchQrCode();
          if (found || attempts >= 6) {
            clearInterval(intervalId);
            if (found) {
              toast.success("QR code berhasil dimuat!");
            } else {
              toast.error("Gagal memuat QR code, silahkan coba klik 'Click to Reveal' ulang.");
            }
          }
        })();
      }, 2500);

    } catch {
      toast.error("Tidak dapat menghubungi bot");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Phone className="h-5 w-5 text-indigo-600" />
            WhatsApp Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Primary Connection</span>
            <span className="text-sm text-slate-500">
              {status.connected ? `Connected as ${formatPhoneNumber(status.phoneNumber)}` : "Belum terhubung"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <Badge
                variant="outline"
                className={status.connected ? "border-green-500 text-green-600" : "border-slate-300 text-slate-500"}
              >
                {status.connected ? "Active Connection" : "Disconnected"}
              </Badge>
              <span className="text-slate-500">Last ping: {relativeTime(status.lastPingAt)}</span>
            </div>
            {status.connected ? (
              <Button variant="outline" size="sm" onClick={() => { void handleDisconnect(); }} disabled={isDisconnecting}>
                {isDisconnecting ? "Memutuskan..." : "Disconnect"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <QrCode className="h-5 w-5 text-indigo-600" />
            Link New Device
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">
            Need to connect a secondary number or reset your connection? Scan the QR code using the WhatsApp app on your phone.
          </p>
          <ol className="list-inside list-decimal space-y-1 text-sm text-slate-500">
            <li>Open WhatsApp on your phone</li>
            <li>
              Tap Menu or Settings and select <strong>Link Devices</strong>
            </li>
            <li>Tap on <strong>Link a Device</strong></li>
            <li>Point your phone to this screen to capture the code</li>
          </ol>
          <div className="flex justify-center py-4">
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
              {isLoadingQr ? (
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              ) : qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR code WhatsApp" className="h-full w-full rounded-lg object-contain p-2" />
              ) : (
                <QrCode className="h-16 w-16 text-slate-300" />
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { void handleRevealOrGenerateQr(); }}>
              <Link2 className="mr-2 h-4 w-4" />
              {qrDataUrl ? "Sembunyikan QR" : "Click to Reveal"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { void handleGenerateNewQr(); }}
              disabled={isGenerating}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "Memulai..." : "Generate New QR Code"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}