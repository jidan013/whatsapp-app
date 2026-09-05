"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Type,
  Tag,
  FileText,
  UserPlus,
  MapPin,
  Calendar,
  Clock,
  Flag,
  CheckCircle2,
  Paperclip,
  Send,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  createAgendaAction,
  type ActionResult,
} from "@/server/actions/agenda.actions";
import type {
  Agenda,
  AgendaCategory,
  AgendaStatus,
  Technician,
  User,
} from "@prisma/client";

interface AgendaFormProps {
  categories: AgendaCategory[];
  technicians: (Technician & { user: User })[];
  statuses: AgendaStatus[];
}

const initialState: ActionResult<Agenda> | null = null;

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100";
const sectionLabelClass = "text-sm font-semibold text-slate-900";
const fieldLabelClass =
  "flex items-center gap-1.5 text-sm font-medium text-slate-600";

function getTodayDateInputValue() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function AgendaForm({
  categories,
  technicians,
  statuses,
}: AgendaFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createAgendaAction,
    initialState,
  );
  const [notifyTechnician, setNotifyTechnician] = React.useState(true);
  const [selectedTechnicianIds, setSelectedTechnicianIds] = React.useState<
    string[]
  >([]);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const attachmentInputRef = React.useRef<HTMLInputElement>(null);
  const todayValue = React.useMemo(() => getTodayDateInputValue(), []);

  React.useEffect(() => {
    if (state?.success) {
      toast.success("Pekerjaan berhasil dicatat");
      router.push(`/agenda/${state.data.id}`);
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state, router]);

  function fieldError(field: string): string | undefined {
    if (state && !state.success) {
      return state.fieldErrors?.[field]?.[0];
    }
    return undefined;
  }

  function toggleTechnician(id: string) {
    setSelectedTechnicianIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function syncAttachmentInput(files: File[]) {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    if (attachmentInputRef.current) {
      attachmentInputRef.current.files = dt.files;
    }
  }

  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? []);
    const combined = [...attachments, ...newFiles];
    setAttachments(combined);
    syncAttachmentInput(combined);
  }

  function removeAttachment(index: number) {
    const next = attachments.filter((_, i) => i !== index);
    setAttachments(next);
    syncAttachmentInput(next);
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Catat Pekerjaan
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Catat pekerjaan yang telah atau sedang dilakukan, lengkap dengan
          teknisi dan bukti dokumentasi.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom kiri */}
        <div className="space-y-6 lg:col-span-2">
          {/* Informasi Pekerjaan */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className={sectionLabelClass}>Informasi Pekerjaan</h2>

            <div className="space-y-1.5">
              <label htmlFor="title" className={fieldLabelClass}>
                <Type className="h-3.5 w-3.5 text-slate-400" />
                Judul Pekerjaan
              </label>
              <input
                id="title"
                name="title"
                required
                minLength={3}
                maxLength={200}
                placeholder="Masukkan judul pekerjaan singkat"
                className={fieldClass}
              />
              {fieldError("title") ? (
                <p className="text-sm text-red-600">{fieldError("title")}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="categoryId" className={fieldLabelClass}>
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                Kategori
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                className={fieldClass}
              >
                <option value="" disabled>
                  Pilih Kategori
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className={fieldLabelClass}>
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Keterangan Pekerjaan
              </label>
              <Textarea
                id="description"
                name="description"
                required
                minLength={10}
                rows={5}
                placeholder="Jelaskan pekerjaan yang dilakukan..."
                className={fieldClass}
              />
              {fieldError("description") ? (
                <p className="text-sm text-red-600">
                  {fieldError("description")}
                </p>
              ) : null}
            </div>
          </div>

          {/* Penugasan & Lokasi */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className={sectionLabelClass}>Teknisi &amp; Lokasi</h2>

            <div className="space-y-1.5">
              <label className={fieldLabelClass}>
                <UserPlus className="h-3.5 w-3.5 text-slate-400" />
                Teknisi
              </label>
              <p className="text-xs text-slate-400">
                Pilih satu atau lebih teknisi yang mengerjakan.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {technicians.map((technician) => {
                  const isChecked = selectedTechnicianIds.includes(
                    technician.id,
                  );
                  return (
                    <label
                      key={technician.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        isChecked
                          ? "border-blue-300 bg-blue-50 text-blue-900"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="technicianIds"
                        value={technician.id}
                        checked={isChecked}
                        onChange={() => toggleTechnician(technician.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
                      />
                      {technician.user.name}
                    </label>
                  );
                })}
              </div>
              {fieldError("technicianIds") ? (
                <p className="text-sm text-red-600">
                  {fieldError("technicianIds")}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="location" className={fieldLabelClass}>
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Lokasi
              </label>
              <input
                id="location"
                name="location"
                maxLength={300}
                placeholder="Misal: Gedung Utama Lt. 4, Ruang Server 101"
                className={fieldClass}
              />
              <p className="text-xs text-slate-400">
                Sebutkan gedung, lantai, dan ruangan dalam satu baris agar mudah
                ditemukan.
              </p>
            </div>
          </div>
        </div>

        {/* Kolom kanan */}
        <div className="space-y-6">
          {/* Waktu, Status & Prioritas */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className={sectionLabelClass}>Waktu, Status &amp; Prioritas</h2>

            <div className="space-y-1.5">
              <label htmlFor="scheduledDate" className={fieldLabelClass}>
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Tanggal Pekerjaan
              </label>
              <input
                id="scheduledDate"
                name="scheduledDate"
                type="date"
                required
                defaultValue={todayValue}
                className={fieldClass}
              />
              {fieldError("scheduledDate") ? (
                <p className="text-sm text-red-600">
                  {fieldError("scheduledDate")}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="scheduledTime" className={fieldLabelClass}>
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Waktu Mulai (opsional)
              </label>
              <input
                id="scheduledTime"
                name="scheduledTime"
                type="time"
                className={fieldClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="scheduledEndDate" className={fieldLabelClass}>
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Tanggal Selesai (opsional)
              </label>
              <input
                id="scheduledEndDate"
                name="scheduledEndDate"
                type="date"
                className={fieldClass}
              />
              <p className="text-xs text-slate-400">
                Kosongkan kalau pekerjaan selesai di hari yang sama.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="scheduledEndTime" className={fieldLabelClass}>
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Waktu Selesai (opsional)
              </label>
              <input
                id="scheduledEndTime"
                name="scheduledEndTime"
                type="time"
                className={fieldClass}
              />
              {fieldError("scheduledEndDate") ? (
                <p className="text-sm text-red-600">
                  {fieldError("scheduledEndDate")}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="statusId" className={fieldLabelClass}>
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                Status
              </label>
              <select
                id="statusId"
                name="statusId"
                required
                defaultValue=""
                className={fieldClass}
              >
                <option value="" disabled>
                  Pilih Status
                </option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
              {fieldError("statusId") ? (
                <p className="text-sm text-red-600">{fieldError("statusId")}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="priority" className={fieldLabelClass}>
                <Flag className="h-3.5 w-3.5 text-slate-400" />
                Prioritas
              </label>
              {/* PENTING: value harus sama persis dengan enum AgendaPriority di Prisma
                  (RENDAH/SEDANG/TINGGI/URGENT) - enum ini sudah di-localize ke Indonesia. */}
              <select
                id="priority"
                name="priority"
                defaultValue="SEDANG"
                className={fieldClass}
              >
                <option value="RENDAH">Rendah</option>
                <option value="SEDANG">Sedang</option>
                <option value="TINGGI">Tinggi</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Lampiran & Notifikasi */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className={sectionLabelClass}>Lampiran &amp; Notifikasi</h2>

            <div className="space-y-1.5">
              <label htmlFor="attachment" className={fieldLabelClass}>
                <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                Foto / Dokumen Bukti
              </label>
              <label
                htmlFor="attachment"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center hover:border-blue-300 hover:bg-blue-50/40"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                  <Upload className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">
                  Klik untuk unggah atau seret file
                </p>
                <p className="text-xs text-slate-400">
                  JPG, PNG, PDF (Maks 5MB per file, bisa lebih dari satu)
                </p>
              </label>
              <input
                ref={attachmentInputRef}
                id="attachment"
                name="attachment"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleAttachmentChange}
                className="hidden"
              />

              {attachments.length > 0 ? (
                <ul className="space-y-1.5">
                  {attachments.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate text-slate-700">
                        {file.name}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatFileSize(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        aria-label={`Hapus ${file.name}`}
                        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="space-y-2">
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Catatan tambahan (opsional)"
                className={fieldClass}
              />
            </div>

            <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <Send className="h-4 w-4 text-emerald-600" />
                <span>
                  Notifikasi Teknisi
                  <span className="block text-xs font-normal text-slate-400">
                    Kirim detail via WhatsApp
                  </span>
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={notifyTechnician}
                onClick={() => setNotifyTechnician((v) => !v)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  notifyTechnician ? "bg-emerald-500" : "bg-slate-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    notifyTechnician ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <input
                type="hidden"
                name="notifyTechnician"
                value={notifyTechnician ? "true" : "false"}
              />
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => router.back()}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 gap-1.5 bg-blue-700 text-white hover:bg-blue-800"
            >
              <Send className="h-4 w-4" />
              {isPending ? "Menyimpan..." : "Simpan Pekerjaan"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
