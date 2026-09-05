import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { SearchFiltersSidebar } from "@/components/search/search-filters-sidebar";
import { SearchBar } from "@/components/search/search-bar";
import { WorkOrderResultCard, MediaResultCard, UserResultCard } from "@/components/search/result-cards";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Search" };

const PAGE_SIZE = 9;

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    dateRange?: string;
    sort?: string;
    page?: string;
  }>;
}

function getDateFilter(dateRange: string): Prisma.DateTimeFilter | undefined {
  if (dateRange === "last30days") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return { gte: thirtyDaysAgo };
  }
  return undefined;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category ?? "all";
  const statusFilter = params.status ?? "all";
  const dateRange = params.dateRange ?? "all";
  const sort = params.sort === "oldest" ? "asc" : "desc";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const dateFilter = getDateFilter(dateRange);
  const skip = (page - 1) * PAGE_SIZE;

  const availableStatuses = await prisma.agendaStatus.findMany({
    orderBy: { sortOrder: "asc" },
    select: { name: true },
  });

  const whereAgenda: Prisma.AgendaWhereInput = {
    deletedAt: null,
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { location: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(statusFilter !== "all" ? { status: { name: { equals: statusFilter, mode: "insensitive" } } } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const whereMedia: Prisma.AgendaMediaWhereInput = {
    deletedAt: null,
    ...(query
      ? { OR: [{ fileName: { contains: query, mode: "insensitive" } }, { originalName: { contains: query, mode: "insensitive" } }] }
      : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const whereUser: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phoneNumber: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const wantWorkOrders = query && (category === "all" || category === "workorders");
  const wantMedia = query && (category === "all" || category === "media");
  const wantUsers = query && (category === "all" || category === "users");
  const isSingleCategory = category !== "all";

  const [agendaCount, mediaCount, userCount] = await Promise.all([
    query ? prisma.agenda.count({ where: whereAgenda }) : Promise.resolve(0),
    query ? prisma.agendaMedia.count({ where: whereMedia }) : Promise.resolve(0),
    query ? prisma.user.count({ where: whereUser }) : Promise.resolve(0),
  ]);

  const previewTake = isSingleCategory ? PAGE_SIZE : 3;
  const previewSkip = isSingleCategory ? skip : 0;

  const [agendas, rawMedia, users] = await Promise.all([
    wantWorkOrders
      ? prisma.agenda.findMany({
          where: whereAgenda,
          include: { category: true, status: true, assignedTo: true, createdBy: true, technician: { include: { user: true } } },
          take: previewTake,
          skip: category === "workorders" ? previewSkip : 0,
          orderBy: { createdAt: sort },
        })
      : Promise.resolve([]),
    wantMedia
      ? prisma.agendaMedia.findMany({
          where: whereMedia,
          include: { agenda: { select: { id: true, assignedTo: true } } },
          take: previewTake,
          skip: category === "media" ? previewSkip : 0,
          orderBy: { createdAt: sort },
        })
      : Promise.resolve([]),
    wantUsers
      ? prisma.user.findMany({
          where: whereUser,
          include: { userRoles: { include: { role: true } }, technician: true, department: true },
          take: previewTake,
          skip: category === "users" ? previewSkip : 0,
          orderBy: { createdAt: sort },
        })
      : Promise.resolve([]),
  ]);

  const uploaderIds = [...new Set(rawMedia.map((m) => m.uploadedById))];
  const uploaders = uploaderIds.length
    ? await prisma.user.findMany({ where: { id: { in: uploaderIds } }, select: { id: true, name: true } })
    : [];
  const uploaderNameById = new Map(uploaders.map((u) => [u.id, u.name]));
  const mediaItems = rawMedia.map((item) => ({ ...item, uploaderName: uploaderNameById.get(item.uploadedById) ?? "Unknown" }));

  const totalCount = agendaCount + mediaCount + userCount;
  const activeTotal = category === "workorders" ? agendaCount : category === "media" ? mediaCount : category === "users" ? userCount : totalCount;
  const totalPages = isSingleCategory ? Math.max(1, Math.ceil(activeTotal / PAGE_SIZE)) : 1;

  function buildHref(overrides: Record<string, string | undefined>): string {
    const next = new URLSearchParams();
    const merged = { q: query, category, status: statusFilter, dateRange, sort: params.sort, page: String(page), ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value && value !== "all") next.set(key, value);
    }
    return `/search?${next.toString()}`;
  }

  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <SearchFiltersSidebar
        counts={{ all: totalCount, workorders: agendaCount, users: userCount, media: mediaCount }}
        statusOptions={availableStatuses.map((s) => s.name)}
      />

      <div className="min-w-0 flex-1 space-y-6">
        <SearchBar initialQuery={query} />

        {query ? (
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">
              {totalCount} Results for &quot;{query}&quot;
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sort by:</span>
              <a href={buildHref({ sort: sort === "asc" ? undefined : "oldest", page: undefined })} className="font-medium text-primary hover:underline">
                {sort === "asc" ? "Oldest" : "Newest"}
              </a>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-lg font-semibold">Cari work order, user, atau file</h1>
            <p className="text-sm text-muted-foreground">Ketik kata kunci di atas untuk mulai mencari.</p>
          </div>
        )}

        {query && totalCount === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
            Tidak ada hasil untuk &quot;{query}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {agendas.map((item) => (
              <WorkOrderResultCard key={item.id} item={item} />
            ))}
            {mediaItems.map((item) => (
              <MediaResultCard key={item.id} item={item} />
            ))}
            {users.map((item) => (
              <UserResultCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-1 pt-2">
            <Button variant="outline" size="icon" disabled={page <= 1} asChild={page > 1}>
              {page > 1 ? <a href={buildHref({ page: String(page - 1) })}>‹</a> : <span>‹</span>}
            </Button>
            {pageNumbers.map((pageNumber) => (
              <Button key={pageNumber} variant={pageNumber === page ? "default" : "outline"} size="icon" asChild>
                <a href={buildHref({ page: String(pageNumber) })}>{pageNumber}</a>
              </Button>
            ))}
            {totalPages > 5 ? <span className="px-1 text-muted-foreground">...</span> : null}
            <Button variant="outline" size="icon" disabled={page >= totalPages} asChild={page < totalPages}>
              {page < totalPages ? <a href={buildHref({ page: String(page + 1) })}>›</a> : <span>›</span>}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}