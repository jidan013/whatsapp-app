import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { agendaRepository } from "@/repositories/agenda.repository";

/**
 * Integration test ini butuh PostgreSQL nyata (bukan mock) dengan migrasi sudah
 * diterapkan. Jalankan: `docker compose up -d && npx prisma migrate deploy`
 * sebelum menjalankan `npm test`.
 */
describe("agendaRepository (integration)", () => {
  let categoryId: string;
  let statusId: string;
  let userId: string;
  let createdAgendaId: string;

  beforeAll(async () => {
    await prisma.$connect();

    const category = await prisma.agendaCategory.upsert({
      where: { name: "Test Category (integration)" },
      update: {},
      create: { name: "Test Category (integration)" },
    });
    categoryId = category.id;

    const status = await prisma.agendaStatus.upsert({
      where: { code: "PENDING" },
      update: {},
      create: { code: "PENDING", name: "Pending", sortOrder: 1 },
    });
    statusId = status.id;

    const user = await prisma.user.upsert({
      where: { email: "integration-test@example.com" },
      update: {},
      create: { name: "Integration Test User", email: "integration-test@example.com", passwordHash: "not-a-real-hash" },
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (createdAgendaId) {
      await prisma.agenda.delete({ where: { id: createdAgendaId } }).catch(() => undefined);
    }
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    await prisma.agendaCategory.delete({ where: { id: categoryId } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  it("membuat dan mengambil kembali agenda", async () => {
    const created = await agendaRepository.create({
      title: "Test Agenda Integration",
      description: "Dibuat oleh integration test, aman dihapus",
      scheduledDate: new Date(),
      priority: "SEDANG",
      sourceChannel: "WEB",
      categoryId,
      statusId,
      createdById: userId,
    });
    createdAgendaId = created.id;

    expect(created.title).toBe("Test Agenda Integration");

    const fetched = await agendaRepository.findById(created.id);
    expect(fetched?.id).toBe(created.id);
  });

  it("soft delete membuat agenda tidak muncul di findById", async () => {
    await agendaRepository.softDelete(createdAgendaId);
    const fetched = await agendaRepository.findById(createdAgendaId);
    expect(fetched).toBeNull();
  });
});
