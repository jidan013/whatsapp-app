import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { auth } from "@/lib/auth/auth";
import { assertPermission } from "@/lib/rbac/guard";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import { userRepository } from "@/repositories/user.repository";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ForbiddenError } from "@/types/domain-errors";
import {
  UserPlus,
  MoreHorizontal,
  Clock,
  Shield,
  Users,
  Wrench,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { UserFilters } from "@/components/user/user-filters";

export const metadata: Metadata = { title: "User Management" };

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
    department?: string;
  }>;
}

function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return "Never";
  try {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: localeId,
    });
  } catch {
    return "Invalid date";
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleMeta(roleName: string) {
  const map: Record<string, { icon: React.ReactNode; className: string }> = {
    ADMIN: {
      icon: <Shield className="h-3 w-3" />,
      className:
        "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
    },
    SUPERVISOR: {
      icon: <Users className="h-3 w-3" />,
      className:
        "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50",
    },
    TECHNICIAN: {
      icon: <Wrench className="h-3 w-3" />,
      className:
        "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
    },
  };
  return (
    map[roleName.toUpperCase()] ?? {
      icon: null,
      className: "bg-slate-100 text-slate-700 border-slate-200",
    }
  );
}

// Generate warna avatar fallback yang konsisten
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    assertPermission(session, PERMISSIONS.USERS_READ);
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1"));
  const pageSize = 10;

  // Fetch data untuk dropdown filter
  const [roles, departments] = await Promise.all([
    prisma.role.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Pastikan repository-mu support roleId & departmentId
  const { items, total } = await userRepository.findManyPaginated({
    skip: (page - 1) * pageSize,
    take: pageSize,
    search: params.search,
    roleId: params.role,
    departmentId: params.department,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const buildQueryString = (updates: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    if (params.search) sp.set("search", params.search);
    if (params.role) sp.set("role", params.role);
    if (params.department) sp.set("department", params.department);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === "undefined") sp.delete(k);
      else sp.set(k, v);
    });
    const qs = sp.toString();
    return qs ? `?${qs}` : "";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            User Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage team members, roles, and system access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Manage Roles
          </Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border">
        {/* Tabs */}
        <div className="border-b border-border px-6">
          <div className="flex gap-6">
            <button className="border-b-2 border-primary pb-3 pt-4 text-sm font-medium text-primary">
              Users Directory
            </button>
            <button className="pb-3 pt-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Permission Matrix
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-border bg-card px-6 py-4">
          <UserFilters roles={roles} departments={departments} />
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-10 text-xs font-medium uppercase text-muted-foreground">
                  User
                </TableHead>
                <TableHead className="h-10 text-xs font-medium uppercase text-muted-foreground">
                  Role
                </TableHead>
                <TableHead className="h-10 text-xs font-medium uppercase text-muted-foreground">
                  Department
                </TableHead>
                <TableHead className="h-10 text-xs font-medium uppercase text-muted-foreground">
                  Last Activity
                </TableHead>
                <TableHead className="h-10 text-xs font-medium uppercase text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="h-10 text-right text-xs font-medium uppercase text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((user) => (
                <TableRow
                  key={user.id}
                  className="group border-b border-border/50 hover:bg-muted/30"
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-9 w-9 shrink-0">
                        {user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{
                              backgroundColor: stringToColor(user.name),
                            }}
                          >
                            {getInitials(user.name)}
                          </div>
                        )}
                        {user.isActive && (
                          <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {user.userRoles.length > 0 ? (
                        user.userRoles.map((ur) => {
                          const meta = getRoleMeta(ur.role.name);
                          return (
                            <Badge
                              key={ur.id}
                              variant="outline"
                              className={`gap-1 px-2 py-0.5 text-xs font-medium ${meta.className}`}
                            >
                              {meta.icon}
                              {ur.role.name}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">
                    {user.department?.name ?? "-"}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatRelativeTime(user.lastLoginAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant="secondary"
                      className={
                        user.isActive
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                      }
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total} users
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                asChild
              >
                <Link
                  href={`/users${buildQueryString({ page: String(page - 1) })}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                asChild
              >
                <Link
                  href={`/users${buildQueryString({ page: String(page + 1) })}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}