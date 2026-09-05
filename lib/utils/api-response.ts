import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DomainError,
} from "@/types/domain-errors";
import { logger } from "@/lib/logger/logger";

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: "Validasi gagal", fieldErrors: error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json({ success: false, error: error.message, fieldErrors: error.fieldErrors }, { status: 422 });
  }

  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 403 });
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  }

  if (error instanceof ConflictError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 409 });
  }

  if (error instanceof DomainError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  logger.error({ err: error }, "Unhandled error in Route Handler");
  return NextResponse.json({ success: false, error: "Terjadi kesalahan pada server" }, { status: 500 });
}
