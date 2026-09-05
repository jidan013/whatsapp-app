import { describe, it, expect } from "vitest";
import { assertPermission, hasPermission, hasAnyRole } from "@/lib/rbac/guard";
import { PERMISSIONS, type PermissionCode } from "@/lib/rbac/permissions";
import { ForbiddenError, UnauthorizedError } from "@/types/domain-errors";
import type { Session } from "next-auth";

function buildSession(permissions: PermissionCode[], roles: string[] = ["TECHNICIAN"]): Session {
  return {
    user: {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      avatarUrl: null,
      roles,
      permissions,
    },
    expires: new Date(Date.now() + 60_000).toISOString(),
  };
}

describe("assertPermission", () => {
  it("melempar UnauthorizedError jika session null", () => {
    expect(() => assertPermission(null, PERMISSIONS.AGENDA_READ)).toThrow(UnauthorizedError);
  });

  it("melempar ForbiddenError jika permission tidak dimiliki", () => {
    const session = buildSession([PERMISSIONS.AGENDA_READ]);
    expect(() => assertPermission(session, PERMISSIONS.AGENDA_DELETE)).toThrow(ForbiddenError);
  });

  it("tidak melempar error jika permission dimiliki", () => {
    const session = buildSession([PERMISSIONS.AGENDA_READ, PERMISSIONS.AGENDA_CREATE]);
    expect(() => assertPermission(session, PERMISSIONS.AGENDA_CREATE)).not.toThrow();
  });

  it("mendukung pengecekan multiple permission (harus punya semua)", () => {
    const session = buildSession([PERMISSIONS.AGENDA_READ]);
    expect(() => assertPermission(session, [PERMISSIONS.AGENDA_READ, PERMISSIONS.AGENDA_DELETE])).toThrow(ForbiddenError);
  });
});

describe("hasPermission", () => {
  it("mengembalikan false untuk session null", () => {
    expect(hasPermission(null, PERMISSIONS.AGENDA_READ)).toBe(false);
  });

  it("mengembalikan true jika permission ada", () => {
    const session = buildSession([PERMISSIONS.AGENDA_READ]);
    expect(hasPermission(session, PERMISSIONS.AGENDA_READ)).toBe(true);
  });
});

describe("hasAnyRole", () => {
  it("mengembalikan true jika salah satu role cocok", () => {
    const session = buildSession([], ["SUPERVISOR"]);
    expect(hasAnyRole(session, ["ADMIN", "SUPERVISOR"])).toBe(true);
  });

  it("mengembalikan false jika tidak ada role yang cocok", () => {
    const session = buildSession([], ["OPERATOR"]);
    expect(hasAnyRole(session, ["ADMIN", "SUPERVISOR"])).toBe(false);
  });
});
