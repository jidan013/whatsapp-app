import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { auth } from "@/lib/auth/auth";
import { exportService } from "@/server/export/export.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Sheet,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Filter,
  Activity,
  FileDown,
  Calendar,
} from "lucide-react";

export const metadata: Metadata = { title: "Audit & Reporting Center" };

// Mapping status ke variant badge
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  QUEUED: "outline",
  PROCESSING: "secondary",
  COMPLETED: "default",
  FAILED: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  QUEUED: "Antrian",
  PROCESSING: "Diproses",
  COMPLETED: "Success",
  FAILED: "Failed",
};

export default async function ExportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { items, total } = await exportService.listExports(session, {
    skip: 0,
    take: 20,
  });

  // Data untuk filter (ambil daftar user unik)
  const uniqueUsers = Array.from(
    new Map(
      items
        .filter((item) => item.requestedBy?.name)
        .map((item) => [item.requestedBy!.name, item.requestedBy!.name])
    ).values()
  );

  const uniqueEventTypes = Array.from(
    new Set(items.map((item) => item.format))
  );

  // Statistik cepat
  const completed = items.filter((i) => i.status === "COMPLETED").length;
  const failed = items.filter((i) => i.status === "FAILED").length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Audit & Reporting Center
        </h1>
        <p className="text-sm text-muted-foreground">
          Comprehensive log analysis and report generation.
        </p>
      </div>

      {/* Statistik Ringkas */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-blue-50 p-2">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Total</p>
              <p className="text-xl font-bold text-slate-900">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-emerald-50 p-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Success</p>
              <p className="text-xl font-bold text-emerald-600">{completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-red-50 p-2">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Failed</p>
              <p className="text-xl font-bold text-red-600">{failed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Filter + Table + Generate Report */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom kiri: Filter + Tabel (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Filter Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Filter className="h-5 w-5 text-slate-500" />
                Activity Log
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  Report Generation · Scheduled Exports
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label className="text-xs font-medium text-slate-500">Date Range</label>
                  <div className="mt-1 flex items-center gap-1">
                    <Input
                      type="date"
                      defaultValue="2023-10-01"
                      className="h-9 text-xs"
                    />
                    <span className="text-xs text-slate-400">-</span>
                    <Input
                      type="date"
                      defaultValue="2023-10-31"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">User</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="mt-1 h-9 text-xs">
                      <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {uniqueUsers.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Event Type</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="mt-1 h-9 text-xs">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {uniqueEventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button size="sm" className="h-9 w-full text-xs">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabel Log */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-slate-500">
                  <Activity className="h-8 w-8 text-slate-300" />
                  <p>Belum ada aktivitas export.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-medium uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Target</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.slice(0, 10).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {format(new Date(item.createdAt), "yyyy-MM-dd HH:mm:ss", {
                              locale: localeId,
                            })}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {item.requestedBy?.name || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                              {item.format === "PDF" && (
                                <FileText className="h-4 w-4 text-red-500" />
                              )}
                              {item.format === "EXCEL" && (
                                <Sheet className="h-4 w-4 text-emerald-500" />
                              )}
                              {item.format === "CSV" && (
                                <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                              )}
                              {item.format}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {item.filePath?.split("/").pop()?.slice(0, 12) ||
                              item.id.slice(0, 10)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={STATUS_VARIANT[item.status] || "outline"}
                              className="text-xs capitalize"
                            >
                              {STATUS_LABEL[item.status] || item.status.toLowerCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kolom kanan: Generate Report + Scheduled Tasks */}
        <div className="space-y-6">
          {/* Generate Report Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FileDown className="h-5 w-5 text-slate-500" />
                Generate Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Report Type</label>
                <Select defaultValue="technician">
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">Technician Performance</SelectItem>
                    <SelectItem value="sla">SLA Audit</SelectItem>
                    <SelectItem value="workorder">Work Order Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Format</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-2 border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    <FileText className="mr-1 h-4 w-4" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Sheet className="mr-1 h-4 w-4" />
                    XLSX
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileSpreadsheet className="mr-1 h-4 w-4" />
                    CSV
                  </Button>
                </div>
              </div>
              <Button className="w-full">Build Report</Button>
            </CardContent>
          </Card>

          {/* Scheduled Tasks Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Calendar className="h-5 w-5 text-slate-500" />
                Scheduled Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded border border-slate-100 p-3">
                <p className="text-sm font-medium">Weekly Tech Stats</p>
                <p className="text-xs text-muted-foreground">Every Monday, 08:00</p>
              </div>
              <div className="rounded border border-slate-100 p-3">
                <p className="text-sm font-medium">Monthly SLA Audit</p>
                <p className="text-xs text-muted-foreground">1st of Month, 00:00</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}