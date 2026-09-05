import Link from "next/link";
import { FileText, Play } from "lucide-react";
import { User } from "lucide-react";

interface MediaCardProps {
  id: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  originalName: string;
  mimeType: string;
  uploaderName: string;
  createdAt: Date;
  agendaId: string;
}

function extensionBadge(mimeType: string, originalName: string) {
  const fromName = originalName.split(".").pop()?.toUpperCase();
  if (fromName) return fromName;
  return mimeType.split("/").pop()?.toUpperCase() ?? "FILE";
}

export function MediaCard({ id, type, originalName, mimeType, uploaderName, createdAt, agendaId }: MediaCardProps) {
  const badge = extensionBadge(mimeType, originalName);
  const dateLabel = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(
    createdAt,
  );

  return (
    <Link
      href={`/agenda/${agendaId}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <span className="absolute right-2 top-2 z-10 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {badge}
        </span>

        {type === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/${id}`}
            alt={originalName}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : type === "VIDEO" ? (
          <div className="flex h-full w-full items-center justify-center bg-slate-800">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
              <Play className="ml-0.5 h-4 w-4 text-slate-800" fill="currentColor" />
            </span>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-blue-50">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        )}
      </div>

      <div className="space-y-1.5 p-3">
        <p className="truncate text-sm font-medium text-slate-900">{originalName}</p>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {uploaderName}
          </span>
          <span>{dateLabel}</span>
        </div>
      </div>
    </Link>
  );
}