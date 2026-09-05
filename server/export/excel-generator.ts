import "server-only";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import type { AgendaExportRow } from "@/server/export/types";

export async function generateAgendaExcel(rows: AgendaExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "WhatsApp Agenda System";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Agenda");

  sheet.columns = [
    { header: "Judul", key: "title", width: 30 },
    { header: "Kategori", key: "category", width: 18 },
    { header: "Status", key: "status", width: 16 },
    { header: "Prioritas", key: "priority", width: 12 },
    { header: "Tanggal", key: "date", width: 14 },
    { header: "Jam", key: "time", width: 10 },
    { header: "Lokasi", key: "location", width: 24 },
    { header: "Teknisi", key: "technician", width: 22 },
    { header: "Deskripsi", key: "description", width: 40 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };

  for (const row of rows) {
    sheet.addRow({
      title: row.title,
      category: row.category.name,
      status: row.status.name,
      priority: row.priority,
      date: format(new Date(row.scheduledDate), "yyyy-MM-dd"),
      time: row.scheduledTime ?? "-",
      location: row.location ?? "-",
      technician: row.technician?.user.name ?? "-",
      description: row.description,
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
