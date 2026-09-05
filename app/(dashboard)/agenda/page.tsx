// app/agenda/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { agendaService } from "@/services/agenda.service";
import { agendaListFilterSchema } from "@/lib/validation/agenda.schema";
import { AgendaFilterBar } from "@/components/agenda/agenda-filter-bar";
import { AgendaTable } from "@/components/agenda/agenda-table";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Daftar Agenda" };

interface AgendaPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const filter = agendaListFilterSchema.parse(params);
  const result = await agendaService.list(session, filter);
  const filterOptions = await agendaService.getFilterOptions(session);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Daftar Agenda</h1>
        <p className="text-sm text-muted-foreground">
          Kelola dan pantau semua Work Order aktif.
        </p>
      </div>

      <AgendaFilterBar
        initialValues={{
          tanggal: filter.tanggal,
          teknisi: filter.teknisi,
          status: filter.status,
          prioritas: filter.prioritas,
        }}
        options={filterOptions}
      />

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm">
          <Link href="/agenda/export-csv" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Ekspor CSV
          </Link>
        </Button>
        <Button size="sm">
          <Link href="/agenda/new" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Agenda Baru
          </Link>
        </Button>
      </div>

      <AgendaTable items={result.items} pagination={result.pagination} />
    </div>
  );
}