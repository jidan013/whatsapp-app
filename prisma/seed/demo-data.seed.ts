import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";

const DEMO_CATEGORIES = ["Pemeliharaan", "Perbaikan", "Layanan"];

const DEMO_STATUSES = [
  { name: "Menunggu", code: "PENDING", colorHex: "#F59E0B", isTerminal: false, sortOrder: 1 },
  { name: "Dikerjakan", code: "IN_PROGRESS", colorHex: "#3B82F6", isTerminal: false, sortOrder: 2 },
  { name: "Selesai", code: "COMPLETED", colorHex: "#10B981", isTerminal: true, sortOrder: 3 },
  { name: "Dibatalkan", code: "CANCELLED", colorHex: "#EF4444", isTerminal: true, sortOrder: 4 },
];

const DEMO_TECHNICIANS = [
  { name: "Agus", employeeCode: "TCH-001" },
  { name: "Jidan", employeeCode: "TCH-002" },
  { name: "Rizky", employeeCode: "TCH-003" },
  { name: "Supriyadi", employeeCode: "TCH-004" },
  { name: "Nugroho", employeeCode: "TCH-005" },
  { name: "Joko", employeeCode: "TCH-006" },
];

// Password default untuk akun teknisi demo - GANTI setelah seed kalau teknisi
// perlu login sendiri. Nomor telepon di bawah ini PLACEHOLDER, ganti dengan
// nomor WhatsApp asli supaya notifikasi bot benar-benar sampai ke mereka.
const DEFAULT_PASSWORD = "teknisi123";

export async function seedStatuses(prisma: PrismaClient) {
  for (const status of DEMO_STATUSES) {
    await prisma.agendaStatus.upsert({
      where: { code: status.code },
      update: {
        name: status.name,
        colorHex: status.colorHex,
        isTerminal: status.isTerminal,
        sortOrder: status.sortOrder,
      },
      create: status,
    });
  }
  console.warn(`✓ Seeded ${DEMO_STATUSES.length} status agenda`);
}

export async function seedCategories(prisma: PrismaClient) {
  for (const name of DEMO_CATEGORIES) {
    await prisma.agendaCategory.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }
  console.warn(`✓ Seeded ${DEMO_CATEGORIES.length} kategori agenda`);
}

export async function seedTechnicians(prisma: PrismaClient) {
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  for (const [index, tech] of DEMO_TECHNICIANS.entries()) {
    const email = `${tech.name.toLowerCase()}@teknisi.local`;
    const placeholderPhone = `62800000${String(index + 1).padStart(4, "0")}`; // GANTI dengan nomor WA asli

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: tech.name,
        email,
        passwordHash,
        phoneNumber: placeholderPhone,
        isActive: true,
      },
    });

    await prisma.technician.upsert({
      where: { userId: user.id },
      update: { employeeCode: tech.employeeCode, isActive: true },
      create: {
        userId: user.id,
        employeeCode: tech.employeeCode,
        isActive: true,
      },
    });
  }

  console.warn(`✓ Seeded ${DEMO_TECHNICIANS.length} teknisi`);
  console.warn(
    `  ⚠ Nomor WhatsApp teknisi masih PLACEHOLDER (62800000xxxx) - ganti manual di tabel users sebelum pakai notifikasi WA`,
  );
}