import "server-only";
import { prisma } from "@/lib/prisma";
import type { PermissionCode } from "@/lib/rbac/permissions";
import type { Prisma } from "@prisma/client";

export interface AuthenticatedUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl: string | null;
  isActive: boolean;
  roles: string[];
  permissions: PermissionCode[];
}

const authUserInclude = {
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

function mapToAuthenticatedUser(
  user: Prisma.UserGetPayload<{ include: typeof authUserInclude }>,
): AuthenticatedUserRecord {
  const roles = user.userRoles.map((userRole) => userRole.role.name);
  const permissionSet = new Set<PermissionCode>();
  for (const userRole of user.userRoles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      permissionSet.add(rolePermission.permission.code as PermissionCode);
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    roles,
    permissions: Array.from(permissionSet),
  };
}

export const userRepository = {
  async findAuthenticatedUserByEmail(email: string): Promise<AuthenticatedUserRecord | null> {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: authUserInclude,
    });
    if (!user) return null;
    return mapToAuthenticatedUser(user);
  },

  async touchLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  },

  async findById(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        department: true,
        userRoles: { include: { role: true } },
      },
    });
  },

  async findManyPaginated(params: {
    skip: number;
    take: number;
    search?: string;
    roleId?: string;
    departmentId?: string;
  }) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(params.roleId
        ? {
            userRoles: {
              some: {
                roleId: params.roleId,
              },
            },
          }
        : {}),
      ...(params.departmentId
        ? {
            departmentId: params.departmentId,
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
        include: { department: true, userRoles: { include: { role: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  },
};