import Link from "next/link";
import { ClipboardList, FileImage, FileVideo, FileText, User as UserIcon, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Prisma } from "@prisma/client";

function formatWoId(agendaId: string): string {
  return agendaId.slice(0, 8).toUpperCase();
}

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

type AgendaWithIncludes = Prisma.AgendaGetPayload<{
  include: {
    category: true;
    status: true;
    assignedTo: true;
    createdBy: true;
    technician: { include: { user: true } };
  };
}>;

export function WorkOrderResultCard({ item }: { item: AgendaWithIncludes }) {
  const assigneeName = item.assignedTo?.name ?? item.technician?.user.name;

  return (
    <Link href={`/agenda/${item.id}`} className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <Badge variant="outline" className="font-mono text-xs">
            WO-{formatWoId(item.id)}
          </Badge>
        </div>
        {item.sourceChannel === "WHATSAPP" ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <MessageCircle className="h-3 w-3" />
            via WhatsApp
          </span>
        ) : null}
      </div>
      <h3 className="mb-1 line-clamp-1 font-semibold">{item.title}</h3>
      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{item.description || "Tidak ada deskripsi"}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
        <span>Assigned: {assigneeName ?? "Unassigned"}</span>
        <Badge>{item.status?.name}</Badge>
        <span>{new Date(item.createdAt).toLocaleDateString("id-ID")}</span>
      </div>
    </Link>
  );
}

type MediaResult = Prisma.AgendaMediaGetPayload<{
  include: { agenda: { select: { id: true; assignedTo: true } } };
}> & { uploaderName: string };

const MEDIA_ICON = { IMAGE: FileImage, VIDEO: FileVideo, DOCUMENT: FileText } as const;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function MediaResultCard({ item }: { item: MediaResult }) {
  const Icon = MEDIA_ICON[item.type];

  return (
    <Link
      href={`/agenda/${item.agenda.id}`}
      className="block overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted/30"
    >
      <div className="flex h-24 items-center justify-center gap-2 bg-slate-900 text-slate-300">
        <Icon className="h-5 w-5" />
        <span className="text-xs">{item.type}</span>
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-medium">{item.originalName || item.fileName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Uploaded by {item.uploaderName} · {formatFileSize(item.sizeBytes)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Assigned: {item.agenda?.assignedTo?.name ?? "Unassigned"}
        </p>
      </div>
    </Link>
  );
}

type UserWithIncludes = Prisma.UserGetPayload<{
  include: { userRoles: { include: { role: true } }; technician: true; department: true };
}>;

export function UserResultCard({ item }: { item: UserWithIncludes }) {
  const primaryRole = item.userRoles[0]?.role?.name ?? null;

  return (
    <Link href={`/users/${item.id}`} className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {initials(item.name)}
        </div>
        <div>
          <p className="font-semibold">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.department?.name ?? "Tanpa departemen"}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {primaryRole ? <Badge variant="secondary">{primaryRole}</Badge> : null}
        {item.technician?.specialization ? <Badge variant="outline">{item.technician.specialization}</Badge> : null}
        {!primaryRole && !item.technician?.specialization ? (
          <Badge variant="outline" className="gap-1">
            <UserIcon className="h-3 w-3" />
            No additional info
          </Badge>
        ) : null}
      </div>
    </Link>
  );
}