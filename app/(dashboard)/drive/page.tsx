import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { auth } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/types/domain-errors";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "Google Drive" };

export default async function GoogleDrivePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    assertPermission(session, PERMISSIONS.GOOGLE_DRIVE_SYNC);
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }

  const files = await prisma.googleDriveFile.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Google Drive</h1>
        <p className="text-sm text-muted-foreground">{files.length} file tersinkronisasi ke Google Drive.</p>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {files.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Belum ada file tersinkronisasi. Pastikan GOOGLE_SERVICE_ACCOUNT_EMAIL dan
              GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY sudah diisi di .env.
            </p>
          ) : (
            files.map((file) => (
              <a key={file.id} href={file.driveUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 text-sm hover:bg-muted/30">
                <div>
                  <p className="font-medium">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.sizeBytes / 1024).toFixed(1)} KB · {format(new Date(file.createdAt), "d MMM yyyy HH:mm", { locale: localeId })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{file.category}</Badge>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </a>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
