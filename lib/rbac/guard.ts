import "server-only";
import { auth } from "@/lib/auth/auth";
import { ForbiddenError, UnauthorizedError } from "@/types/domain-errors";
import type { PermissionCode } from "@/lib/rbac/permissions";
import type { Session } from "next-auth";

/**
 * Cek permission memakai Session yang SUDAH ada di tangan caller (mis. hasil
 * `await auth()` di Server Action / Route Handler). Sinkron, tidak fetch ulang.
 * Dipakai di dalam service layer supaya tidak ada dua sumber session berbeda
 * dalam satu request.
 */
export function assertPermission(session: Session | null, required: PermissionCode | PermissionCode[]): Session {
  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const requiredList = Array.isArray(required) ? required : [required];
  const hasAll = requiredList.every((code) => session.user.permissions.includes(code));

  if (!hasAll) {
    throw new ForbiddenError(`Membutuhkan permission: ${requiredList.join(", ")}`);
  }

  return session;
}

/**
 * Versi async untuk dipakai di Route Handler/Server Action paling luar, saat
 * caller belum punya Session di tangan. Melakukan `auth()` sekali lalu
 * delegasikan ke assertPermission.
 */
export async function requirePermission(required: PermissionCode | PermissionCode[]): Promise<Session> {
  const session = await auth();
  return assertPermission(session, required);
}

export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session;
}

export function hasPermission(session: Session | null, code: PermissionCode): boolean {
  return Boolean(session?.user?.permissions.includes(code));
}

export function hasAnyRole(session: Session | null, roles: string[]): boolean {
  if (!session?.user) return false;
  return session.user.roles.some((role) => roles.includes(role));
}
