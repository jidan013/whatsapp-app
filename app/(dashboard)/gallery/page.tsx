import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, FileUp } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { MediaCard } from "@/components/gallery/media-card";
import type { MediaType } from "@prisma/client";
import { UploadMediaDialog } from "@/components/gallery/upload-media-dialog";

export const metadata: Metadata = { title: "Gallery" };

interface GalleryPageProps {
  searchParams: Promise<{ type?: string; q?: string }>;
}

const TABS: { key: string; label: string; type: MediaType | null }[] = [
  { key: "all", label: "All", type: null },
  { key: "photos", label: "Photos", type: "IMAGE" },
  { key: "videos", label: "Videos", type: "VIDEO" },
  { key: "docs", label: "Docs", type: "DOCUMENT" },
];

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const defaultTab = TABS[0] ?? { key: "all", label: "All", type: null };
  const activeTab = TABS.find((t) => t.key === params.type) ?? defaultTab;
  const query = params.q?.trim() ?? "";

  const media = await prisma.agendaMedia.findMany({
    where: {
      deletedAt: null,
      ...(activeTab.type ? { type: activeTab.type } : {}),
      ...(query
        ? {
            OR: [
              { originalName: { contains: query, mode: "insensitive" } },
              { agenda: { title: { contains: query, mode: "insensitive" } } },
              { agenda: { location: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      agenda: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const uploaderIds = [...new Set(media.map((m) => m.uploadedById))];
  const uploaders = await prisma.user.findMany({
    where: { id: { in: uploaderIds } },
    select: { id: true, name: true },
  });
  const uploaderNameById = new Map(uploaders.map((u) => [u.id, u.name]));

  const buildHref = (tabKey: string) => {
    const p = new URLSearchParams();
    if (tabKey !== "all") p.set("type", tabKey);
    if (query) p.set("q", query);
    const qs = p.toString();
    return qs ? `/gallery?${qs}` : "/gallery";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Media Gallery</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola dan atur aset operasional.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 text-sm">
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={buildHref(tab.key)}
                className={
                  tab.key === activeTab.key
                    ? "bg-blue-700 px-3.5 py-1.5 font-semibold text-white"
                    : "px-3.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
                }
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
          <UploadMediaDialog />
        </div>
      </div>

      <form action="/gallery" method="GET" className="relative">
        {activeTab.key !== "all" ? <input type="hidden" name="type" value={activeTab.key} /> : null}
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Cari media berdasarkan nama file, agenda, atau lokasi..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </form>

      <UploadMediaDialog
        triggerClassName="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-10 text-center hover:border-blue-300 hover:bg-blue-50/40"
        trigger={
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <FileUp className="h-5 w-5 text-blue-600" />
            </span>
            <p className="text-sm font-semibold text-slate-900">Klik untuk unggah file</p>
            <p className="text-xs text-slate-400">Pilih agenda tujuan lalu unggah file (Maks 50MB)</p>
          </>
        }
      />

      {media.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Tidak ada media yang cocok dengan filter ini.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              id={item.id}
              type={item.type}
              originalName={item.originalName}
              mimeType={item.mimeType}
              uploaderName={uploaderNameById.get(item.uploadedById) ?? "System"}
              createdAt={item.createdAt}
              agendaId={item.agenda.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}