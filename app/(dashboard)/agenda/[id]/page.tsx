import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { FileText, MapPin, Flag, Wrench, UserCircle, Radio, Paperclip, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { agendaService } from "@/services/agenda.service";
import { NotFoundError } from "@/types/domain-errors";
import { AgendaDetailActions } from "@/components/agenda/agenda-detail-actions";
import { AgendaShareDialog } from "@/components/agenda/agenda-share-dialog";
import { CommentForm } from "@/components/agenda/comment-form";

export const metadata: Metadata = { title: "Detail Agenda" };

interface AgendaDetailPageProps {
  params: Promise<{ id: string }>;
}

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  RENDAH: { label: "Rendah", className: "bg-slate-100 text-slate-600" },
  SEDANG: { label: "Sedang", className: "bg-blue-50 text-blue-700" },
  TINGGI: { label: "Tinggi", className: "bg-orange-50 text-orange-700" },
  URGENT: { label: "Urgent", className: "bg-red-50 text-red-700" },
};

export default async function AgendaDetailPage({ params }: AgendaDetailPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  try {
    const agenda = await agendaService.getById(session, id);
    const priorityMeta = PRIORITY_META[agenda.priority] ?? {
      label: agenda.priority,
      className: "bg-slate-100 text-slate-600",
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{agenda.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {format(new Date(agenda.scheduledDate), "EEEE, d MMMM yyyy", { locale: localeId })}
              {agenda.scheduledTime ? ` · ${agenda.scheduledTime}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {agenda.category.name}
            </span>
            <span
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={{ borderColor: agenda.status.colorHex, color: agenda.status.colorHex }}
            >
              {agenda.status.name}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Kolom kiri */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-slate-400" />
                Deskripsi
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{agenda.description}</p>
              {agenda.notes ? (
                <>
                  <p className="mt-4 text-sm font-medium text-slate-900">Catatan</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">{agenda.notes}</p>
                </>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Paperclip className="h-4 w-4 text-slate-400" />
                Media ({agenda.media.length})
              </h2>
              {agenda.media.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">Belum ada media terlampir.</p>
              ) : (
                <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {agenda.media.map((media) => (
                    <li key={media.id}>
                      <a
                        href={`/api/gallery/${media.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 hover:border-blue-300 hover:bg-blue-50/40"
                      >
                        <span className="min-w-0 flex-1 truncate">{media.originalName}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Komentar ({agenda.comments.length})</h2>
              <CommentForm
                agendaId={agenda.id}
                currentUserId={session.user.id}
                isAdmin={session.user.roles.includes("ADMIN")}
                comments={agenda.comments}
              />
            </div>
          </div>

          {/* Kolom kanan */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Informasi</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    Lokasi
                  </span>
                  <span className="text-right font-medium text-slate-900">{agenda.location ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Flag className="h-3.5 w-3.5 text-slate-400" />
                    Prioritas
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityMeta.className}`}>
                    {priorityMeta.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Wrench className="h-3.5 w-3.5 text-slate-400" />
                    Teknisi
                  </span>
                  <span className="text-right font-medium text-slate-900">
                    {agenda.technician?.user.name ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <UserCircle className="h-3.5 w-3.5 text-slate-400" />
                    Dibuat oleh
                  </span>
                  <span className="text-right font-medium text-slate-900">{agenda.createdBy.name}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Radio className="h-3.5 w-3.5 text-slate-400" />
                    Sumber
                  </span>
                  <span className="text-right font-medium text-slate-900">{agenda.sourceChannel}</span>
                </div>
              </div>
            </div>

            <AgendaShareDialog agendaId={agenda.id} />

            <AgendaDetailActions agendaId={agenda.id} isTerminalStatus={agenda.status.isTerminal} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}