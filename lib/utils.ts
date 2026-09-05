// lib/utils/api-response.ts
import { NextResponse } from "next/server";
import { DomainError, UnauthorizedError, ForbiddenError, NotFoundError } from "@/types/domain-errors";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function apiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { success: false, error: "Not Found" },
      { status: 404 }
    );
  }
  if (error instanceof DomainError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
  console.error(error);
  return NextResponse.json(
    { success: false, error: "Internal Server Error" },
    { status: 500 }
  );
}