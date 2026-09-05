import "server-only";
import { format } from "date-fns";
import type { AgendaExportRow } from "@/server/export/types";

function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateAgendaCsv(rows: AgendaExportRow[]): Buffer {
  const headers = ["Judul", "Kategori", "Status", "Prioritas", "Tanggal", "Jam", "Lokasi", "Teknisi", "Deskripsi"];
  const lines = [headers.join(",")];

  for (const row of rows) {
    const values = [
      row.title,
      row.category.name,
      row.status.name,
      row.priority,
      format(new Date(row.scheduledDate), "yyyy-MM-dd"),
      row.scheduledTime ?? "-",
      row.location ?? "-",
      row.technician?.user.name ?? "-",
      row.description,
    ].map((value) => escapeCsvValue(String(value)));

    lines.push(values.join(","));
  }

  return Buffer.from(lines.join("\n"), "utf-8");
}
