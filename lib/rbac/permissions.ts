/**
 * Kode permission RBAC. Format: "<resource>:<action>".
 * Dipakai di:
 *  - prisma/seed/rbac.seed.ts (mengisi tabel `permissions`)
 *  - lib/rbac/guard.ts (pengecekan otorisasi di service/route)
 * Menambah permission baru = tambah entri di sini, lalu jalankan ulang seed.
 */
export const PERMISSIONS = {
  AGENDA_CREATE: "agenda:create",
  AGENDA_READ: "agenda:read",
  AGENDA_UPDATE: "agenda:update",
  AGENDA_DELETE: "agenda:delete",
  AGENDA_ASSIGN: "agenda:assign",
  AGENDA_EXPORT: "agenda:export",

  MEDIA_UPLOAD: "media:upload",
  MEDIA_DELETE: "media:delete",

  COMMENT_CREATE: "comment:create",
  COMMENT_DELETE: "comment:delete",

  USERS_MANAGE: "users:manage",
  USERS_READ: "users:read",

  ROLES_MANAGE: "roles:manage",

  DEPARTMENTS_MANAGE: "departments:manage",

  REPORTS_VIEW: "reports:view",

  BACKUP_TRIGGER: "backup:trigger",
  BACKUP_RESTORE: "backup:restore",
  BACKUP_VIEW: "backup:view",

  SETTINGS_MANAGE: "settings:manage",

  ACTIVITY_LOG_VIEW: "activity_log:view",

  GOOGLE_DRIVE_SYNC: "google_drive:sync",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Role bawaan sistem (isSystem = true, tidak bisa dihapus dari UI).
 * Mapping ke permission dipakai oleh seed RBAC.
 */
export const SYSTEM_ROLES = {
  ADMIN: "ADMIN",
  SUPERVISOR: "SUPERVISOR",
  TECHNICIAN: "TECHNICIAN",
  OPERATOR: "OPERATOR",
} as const;

export type SystemRoleName = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

/** Semua permission diberikan ke ADMIN otomatis saat seed (lihat rbac.seed.ts). */
export const ROLE_PERMISSION_MAP: Record<Exclude<SystemRoleName, "ADMIN">, PermissionCode[]> = {
  SUPERVISOR: [
    PERMISSIONS.AGENDA_CREATE,
    PERMISSIONS.AGENDA_READ,
    PERMISSIONS.AGENDA_UPDATE,
    PERMISSIONS.AGENDA_DELETE,
    PERMISSIONS.AGENDA_ASSIGN,
    PERMISSIONS.AGENDA_EXPORT,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_DELETE,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.BACKUP_TRIGGER,
    PERMISSIONS.BACKUP_VIEW,
    PERMISSIONS.ACTIVITY_LOG_VIEW,
    PERMISSIONS.GOOGLE_DRIVE_SYNC,
  ],
  TECHNICIAN: [
    PERMISSIONS.AGENDA_CREATE,
    PERMISSIONS.AGENDA_READ,
    PERMISSIONS.AGENDA_UPDATE,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.COMMENT_CREATE,
  ],
  OPERATOR: [PERMISSIONS.AGENDA_READ, PERMISSIONS.AGENDA_CREATE, PERMISSIONS.COMMENT_CREATE],
};
