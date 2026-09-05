"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, SlidersHorizontal } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils/cn";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "workorders", label: "Work Orders" },
  { value: "users", label: "Users" },
  { value: "media", label: "Media" },
] as const;

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "last30days", label: "Last 30 Days" },
] as const;

const SAVED_SEARCHES_KEY = "agenda-system:saved-searches";

type Category = (typeof CATEGORY_OPTIONS)[number]["value"];

interface SearchFiltersSidebarProps {
  counts: {
    all: number;
    workorders: number;
    users: number;
    media: number;
  };
  statusOptions: string[];
}

export function SearchFiltersSidebar({
  counts,
  statusOptions,
}: SearchFiltersSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "all";
  const activeDateRange = searchParams.get("dateRange") ?? "all";
  const activeStatus = searchParams.get("status") ?? "all";

  const updateParam = React.useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());

      if (value === "all") {
        next.delete(key);
      } else {
        next.set(key, value);
      }

      next.delete("page");

      const queryString = next.toString();

      router.push(
        queryString.length > 0
          ? `/search?${queryString}`
          : "/search"
      );
    },
    [router, searchParams]
  );

  const handleReset = React.useCallback(() => {
    const next = new URLSearchParams();

    const query = searchParams.get("q") ?? "";

    if (query.trim().length > 0) {
      next.set("q", query);
    }

    const queryString = next.toString();

    router.push(
      queryString.length > 0
        ? `/search?${queryString}`
        : "/search"
    );
  }, [router, searchParams]);

  const handleSaveSearch = React.useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const currentSearch = searchParams.toString();

    if (currentSearch.length === 0) {
      return;
    }

    try {
      const rawSavedSearches = window.localStorage.getItem(
        SAVED_SEARCHES_KEY
      );

      const savedSearches: string[] =
        rawSavedSearches !== null
          ? (JSON.parse(rawSavedSearches) as string[])
          : [];

      const updatedSearches = [
        currentSearch,
        ...savedSearches.filter(
          (item) => item !== currentSearch
        ),
      ].slice(0, 10);

      window.localStorage.setItem(
        SAVED_SEARCHES_KEY,
        JSON.stringify(updatedSearches)
      );

      window.alert(
        "Pencarian ini berhasil disimpan di browser Anda."
      );
    } catch {
      window.alert("Gagal menyimpan pencarian.");
    }
  }, [searchParams]);

  return (
    <aside className="w-full shrink-0 space-y-6 rounded-lg border bg-card p-5 lg:w-72">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </h2>

        <button
          type="button"
          onClick={handleReset}
          className="text-sm font-medium text-primary hover:underline"
        >
          Reset
        </button>
      </div>

      {/* CATEGORY */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Category
        </p>

        <div className="space-y-1">
          {CATEGORY_OPTIONS.map((option) => {
            const category: Category = option.value;
            const isActive = activeCategory === category;

            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-md py-1 text-sm transition-colors hover:bg-accent/50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() =>
                      updateParam("category", category)
                    }
                    className="h-4 w-4 rounded border-input accent-primary"
                  />

                  <span>{option.label}</span>
                </span>

                <span className="text-xs text-muted-foreground">
                  {counts[category]}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* DATE RANGE */}
      <div className="space-y-2 border-t pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Date Range
        </p>

        <Select
          value={activeDateRange}
          onValueChange={(value) => {
            updateParam("dateRange", value ?? "all");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>

          <SelectContent>
            {DATE_RANGE_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* STATUS */}
      {statusOptions.length > 0 && (
        <div className="space-y-2 border-t pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </p>

          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => {
              const isActive = activeStatus === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    updateParam(
                      "status",
                      isActive ? "all" : status
                    )
                  }
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-muted-foreground hover:bg-accent"
                  )}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SAVE SEARCH */}
      <div className="border-t pt-4">
        <button
          type="button"
          onClick={handleSaveSearch}
          className="flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Bookmark className="h-4 w-4" />
          Save Search
        </button>
      </div>
    </aside>
  );
}