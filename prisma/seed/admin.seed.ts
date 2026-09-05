import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { SYSTEM_ROLES } from "@/lib/rbac/permissions";

export async function seedAdminUser(prisma: PrismaClient) {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD wajib diisi di .env");
  }

  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD minimal 8 karakter");
  }

  const passwordHash = await hashPassword(password);

  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Administrator",
      email,
      passwordHash,
      isActive: true,
    },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: SYSTEM_ROLES.ADMIN },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`✓ Admin user siap: ${email}`);
}