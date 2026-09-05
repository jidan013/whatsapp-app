import "server-only";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { format } from "date-fns";
import type { AgendaExportRow } from "@/server/export/types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 9, marginBottom: 16, color: "#6B7280" },
  table: { display: "flex", flexDirection: "column", width: "100%" },
  headerRow: { flexDirection: "row", backgroundColor: "#E5E7EB", fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#D1D5DB" },
  cellTitle: { width: "22%", padding: 4 },
  cellCategory: { width: "12%", padding: 4 },
  cellStatus: { width: "12%", padding: 4 },
  cellPriority: { width: "10%", padding: 4 },
  cellDate: { width: "12%", padding: 4 },
  cellLocation: { width: "16%", padding: 4 },
  cellTechnician: { width: "16%", padding: 4 },
});

function AgendaReportDocument({ rows }: { rows: AgendaExportRow[] }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>Laporan Agenda</Text>
        <Text style={styles.subtitle}>Dihasilkan pada {format(new Date(), "d MMMM yyyy HH:mm")} · {rows.length} data</Text>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={styles.cellTitle}>Judul</Text>
            <Text style={styles.cellCategory}>Kategori</Text>
            <Text style={styles.cellStatus}>Status</Text>
            <Text style={styles.cellPriority}>Prioritas</Text>
            <Text style={styles.cellDate}>Tanggal</Text>
            <Text style={styles.cellLocation}>Lokasi</Text>
            <Text style={styles.cellTechnician}>Teknisi</Text>
          </View>

          {rows.map((row) => (
            <View style={styles.row} key={row.id}>
              <Text style={styles.cellTitle}>{row.title}</Text>
              <Text style={styles.cellCategory}>{row.category.name}</Text>
              <Text style={styles.cellStatus}>{row.status.name}</Text>
              <Text style={styles.cellPriority}>{row.priority}</Text>
              <Text style={styles.cellDate}>{format(new Date(row.scheduledDate), "yyyy-MM-dd")}</Text>
              <Text style={styles.cellLocation}>{row.location ?? "-"}</Text>
              <Text style={styles.cellTechnician}>{row.technician?.user.name ?? "-"}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export async function generateAgendaPdf(rows: AgendaExportRow[]): Promise<Buffer> {
  return renderToBuffer(<AgendaReportDocument rows={rows} />);
}
