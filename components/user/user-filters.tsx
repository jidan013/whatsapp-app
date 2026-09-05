"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FilterOption {
  id: string;
  name: string;
}

interface UserFiltersProps {
  roles: FilterOption[];
  departments: FilterOption[];
}

export function UserFilters({ roles, departments }: UserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const role = searchParams.get("role") ?? "";
  const department = searchParams.get("department") ?? "";

  function updateParam(key: string, value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    sp.delete("page"); // reset ke halaman 1 saat filter berubah
    router.push(`/users?${sp.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={search}
          placeholder="Search users by name or email..."
          className="pl-9"
          onChange={(e) => updateParam("search", e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={role}
            onChange={(e) => updateParam("role", e.target.value)}
            className="h-9 w-[140px] appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="relative">
          <select
            value={department}
            onChange={(e) => updateParam("department", e.target.value)}
            className="h-9 w-[160px] appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}