export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} dengan id "${id}" tidak ditemukan`);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Anda belum login") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Anda tidak memiliki izin untuk melakukan aksi ini") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
