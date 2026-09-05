import { PrismaClient } from "@prisma/client";
import { seedPermissions, seedRoles, seedRolePermissions } from "./rbac.seed";
import { seedAdminUser } from "./admin.seed";
import { seedCategories, seedTechnicians, seedStatuses } from "./demo-data.seed";

const prisma = new PrismaClient();

async function main() {
  console.warn("🌱 Mulai seeding...\n");

  await seedPermissions(prisma);
  await seedRoles(prisma);
  await seedRolePermissions(prisma);
  await seedAdminUser(prisma);
  await seedStatuses(prisma);
  await seedCategories(prisma);
  await seedTechnicians(prisma);

  console.warn("\n✅ Seeding selesai.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });