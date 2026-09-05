import type { PrismaClient } from "@prisma/client";
import { PERMISSIONS, SYSTEM_ROLES, ROLE_PERMISSION_MAP, type PermissionCode } from "@/lib/rbac/permissions";

export async function seedPermissions(prisma: PrismaClient) {
  const entries = Object.values(PERMISSIONS).map((code) => {
    const [resource, action] = code.split(":");
    if (!resource || !action) {
      throw new Error(`Invalid permission code format: ${code}`);
    }
    return { code, resource, action };
  });

  for (const entry of entries) {
    await prisma.permission.upsert({
      where: { code: entry.code },
      update: { resource: entry.resource, action: entry.action },
      create: entry,
    });
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Seeded ${entries.length} permissions`);
}

export async function seedRoles(prisma: PrismaClient) {
  const roleNames = Object.values(SYSTEM_ROLES);

  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: { isSystem: true },
      create: {
        name,
        isSystem: true,
        description: `System role: ${name}`,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Seeded ${roleNames.length} roles`);
}

export async function seedRolePermissions(prisma: PrismaClient) {
  const allPermissions = await prisma.permission.findMany();
  const permissionIdByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: SYSTEM_ROLES.ADMIN } });

  // ADMIN mendapat semua permission otomatis
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id },
    });
  }

  // Role lain sesuai ROLE_PERMISSION_MAP
  for (const [roleName, permissionCodes] of Object.entries(ROLE_PERMISSION_MAP) as [
    keyof typeof ROLE_PERMISSION_MAP,
    PermissionCode[],
  ][]) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });

    for (const code of permissionCodes) {
      const permissionId = permissionIdByCode.get(code);
      if (!permissionId) {
        console.warn(`  ⚠ Permission "${code}" tidak ditemukan, dilewati`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log("✓ Seeded role-permission mappings");
}