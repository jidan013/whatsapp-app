import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { AgendaForm } from "@/components/agenda/agenda-form";

export const metadata: Metadata = { title: "Catat Pekerjaan" };

export default async function NewAgendaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [categories, technicians, statuses] = await Promise.all([
    prisma.agendaCategory.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.technician.findMany({
      where: { isActive: true, deletedAt: null },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.agendaStatus.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return <AgendaForm categories={categories} technicians={technicians} statuses={statuses} />;
}