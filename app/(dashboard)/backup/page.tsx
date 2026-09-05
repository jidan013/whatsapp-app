import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { auth } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import { settingsService } from "@/services/settings.service";
import { ForbiddenError } from "@/types/domain-errors";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Clock,
  Shield,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  Cloud,
} from "lucide-react";

export const metadata: Metadata = { title: "Backup & Recovery" };

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  QUEUED: "outline",
  RUNNING: "secondary",
  COMPLETED: "default",
  FAILED: "destructive",
};

export default async function BackupPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    assertPermission(session, PERMISSIONS.BACKUP_VIEW);
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }

  const backups = await prisma.backupLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { triggeredBy: { select: { name: true } } },
  });

  const settings = await settingsService.list();
  const config: Record<string, unknown> = {};
  settings.forEach((s) => {
    config[s.key] = s.value;
  });

  const totalBackups = backups.length;
  const completedBackups = backups.filter((b) => b.status === "COMPLETED");
  const successRate =
    totalBackups > 0 ? ((completedBackups.length / totalBackups) * 100).toFixed(1) : "0";

  const lastSuccessful = completedBackups[0];
  const lastBackupTime = lastSuccessful
    ? format(lastSuccessful.createdAt, "EEEE, HH:mm", { locale: localeId })
    : "Tidak ada";

  const googleDriveSync = (config["google.drive.sync"] as string) || "Connected";
  const googleDriveStatus = (config["google.drive.status"] as string) || "active";
  const automatedRoutine = (config["backup.schedule"] as string) || "Daily at 04:00 AM";
  const retentionPolicy = (config["backup.retention"] as string) || "Keep last 30 days";
  const encryptBackup = (config["backup.encrypt"] as boolean) !== false;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Backup & Disaster Recovery</h1>
        <p className="text-sm text-muted-foreground">
          Manage system snapshots, monitor automated routines, and execute emergency restores.
        </p>
      </div>

      {/* Grid 2 kolom: kiri 2/3, kanan 1/3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom kiri */}
        <div className="space-y-6 lg:col-span-2">
          {/* System Health Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Last Backup</p>
                    <p className="text-lg font-bold">{lastBackupTime}</p>
                  </div>
                  <div className="rounded-full bg-emerald-50 p-2 dark:bg-emerald-950">
                    <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Success Rate</p>
                    <p className="text-lg font-bold">{successRate}%</p>
                  </div>
                  <div className="rounded-full bg-blue-50 p-2 dark:bg-blue-950">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Google Drive Sync</p>
                    <div className="flex items-center gap-1">
                      <Cloud className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{googleDriveSync}</span>
                    </div>
                  </div>
                  <Badge
                    variant={googleDriveStatus === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {googleDriveStatus === "active" ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Manage */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search backups..." className="pl-9" />
            </div>
            <Button variant="outline" size="sm">Manage</Button>
          </div>

          {/* Backup History Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Backup History</CardTitle>
              <CardDescription className="text-xs">
                Showing {Math.min(backups.length, 20)} of {backups.length} backups
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-medium uppercase">Date/Time</TableHead>
                    <TableHead className="text-xs font-medium uppercase">Size</TableHead>
                    <TableHead className="text-xs font-medium uppercase">Source</TableHead>
                    <TableHead className="text-xs font-medium uppercase">Status</TableHead>
                    <TableHead className="text-xs font-medium uppercase">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.slice(0, 20).map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="text-xs">
                        {format(new Date(backup.createdAt), "MMM d, yyyy - HH:mm", { locale: localeId })}
                      </TableCell>
                      <TableCell className="text-xs">
                        {backup.fileSizeBytes
                          ? (backup.fileSizeBytes / 1024 / 1024 / 1024).toFixed(1) + " GB"
                          : "--"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {backup.type === "FULL"
                          ? "Full System"
                          : backup.type === "DATABASE_ONLY"
                          ? "Database"
                          : "Media Files"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_VARIANT[backup.status] || "outline"}
                          className="text-xs capitalize"
                        >
                          {backup.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {backup.status === "FAILED" ? (
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                            View Logs
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Showing 1-{Math.min(backups.length, 20)} of {backups.length} backups
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={backups.length <= 20}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom kanan */}
        <div className="space-y-6">
          {/* Schedule & Policy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Schedule & Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Automated Routine</p>
                <p className="text-sm">{automatedRoutine}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Retention Policy</p>
                <p className="text-sm">{retentionPolicy}</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Encrypt backups at rest</p>
                  <p className="text-xs text-muted-foreground">AES-256 encryption for stored backups</p>
                </div>
                <Switch defaultChecked={encryptBackup} />
              </div>
            </CardContent>
          </Card>

          {/* Disaster Recovery */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-amber-500" />
                Disaster Recovery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Initiate a full system restore from a selected snapshot. This action will overwrite
                current live data and requires secondary auth.
              </p>
              <Button variant="destructive" className="w-full gap-2">
                <AlertTriangle className="h-4 w-4" />
                Initiate Restore Mode
              </Button>
            </CardContent>
          </Card>

          {/* Manual Backup */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Manual Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                Run Backup Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}