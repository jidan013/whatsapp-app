import "server-only";
import QRCode from "qrcode";

export interface AgendaQrCodeResult {
  dataUrl: string;
  shareUrl: string;
}

/**
 * Menghasilkan QR code (sebagai data URL PNG base64) yang mengarah ke halaman
 * detail agenda. Dipakai untuk "Share Link" dan fitur QR Code/Barcode di
 * spesifikasi awal - misal dicetak di work order fisik atau dibagikan cepat
 * ke teknisi di lapangan tanpa perlu mengetik ID manual.
 */
export async function generateAgendaQrCode(agendaId: string): Promise<AgendaQrCodeResult> {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const shareUrl = `${baseUrl}/agenda/${agendaId}`;

  const dataUrl = await QRCode.toDataURL(shareUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
    color: { dark: "#111827", light: "#ffffff" },
  });

  return { dataUrl, shareUrl };
}
