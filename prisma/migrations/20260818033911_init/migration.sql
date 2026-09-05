-- CreateEnum
CREATE TYPE "AgendaPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AgendaSourceChannel" AS ENUM ('WEB', 'WHATSAPP', 'API');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WEB', 'WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('FULL', 'DATABASE_ONLY', 'FILES_ONLY');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'UPLOAD', 'DOWNLOAD', 'EXPORT', 'BACKUP', 'BACKUP_RESTORE', 'GOOGLE_DRIVE_SYNC', 'WHATSAPP_COMMAND', 'API_ERROR', 'SYSTEM_ERROR', 'PERMISSION_DENIED');

-- CreateEnum
CREATE TYPE "GoogleDriveFileCategory" AS ENUM ('AGENDA_MEDIA', 'EXPORT', 'BACKUP');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" UUID,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technicians" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "departmentId" UUID,
    "specialization" TEXT,
    "phoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "technicians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "colorHex" TEXT NOT NULL DEFAULT '#6366F1',
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "agenda_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_status" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL DEFAULT '#6B7280',
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "scheduledDate" DATE NOT NULL,
    "scheduledTime" TEXT,
    "priority" "AgendaPriority" NOT NULL DEFAULT 'MEDIUM',
    "sourceChannel" "AgendaSourceChannel" NOT NULL DEFAULT 'WEB',
    "notes" TEXT,
    "categoryId" UUID NOT NULL,
    "statusId" UUID NOT NULL,
    "departmentId" UUID,
    "technicianId" UUID,
    "createdById" UUID NOT NULL,
    "assignedToId" UUID,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_media" (
    "id" UUID NOT NULL,
    "agendaId" UUID NOT NULL,
    "type" "MediaType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "localPath" TEXT,
    "googleDriveFileId" UUID,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "agenda_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "agendaId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "agendaId" UUID,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exports" (
    "id" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'QUEUED',
    "filters" JSONB NOT NULL,
    "filePath" TEXT,
    "googleDriveFileId" UUID,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_logs" (
    "id" UUID NOT NULL,
    "type" "BackupType" NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'QUEUED',
    "triggeredById" UUID,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT true,
    "filePath" TEXT,
    "fileSizeBytes" INTEGER,
    "checksum" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "googleDriveFileId" UUID,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_drive_files" (
    "id" UUID NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "driveUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "category" "GoogleDriveFileCategory" NOT NULL,
    "parentFolderId" TEXT,
    "driveCreatedTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "google_drive_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" "ActivityAction" NOT NULL,
    "entityType" TEXT,
    "entityId" UUID,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_deletedAt_idx" ON "roles"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE INDEX "departments_deletedAt_idx" ON "departments"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "technicians_userId_key" ON "technicians"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "technicians_employeeCode_key" ON "technicians"("employeeCode");

-- CreateIndex
CREATE INDEX "technicians_departmentId_idx" ON "technicians"("departmentId");

-- CreateIndex
CREATE INDEX "technicians_deletedAt_idx" ON "technicians"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "agenda_categories_name_key" ON "agenda_categories"("name");

-- CreateIndex
CREATE INDEX "agenda_categories_deletedAt_idx" ON "agenda_categories"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "agenda_status_name_key" ON "agenda_status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "agenda_status_code_key" ON "agenda_status"("code");

-- CreateIndex
CREATE INDEX "agenda_categoryId_idx" ON "agenda"("categoryId");

-- CreateIndex
CREATE INDEX "agenda_statusId_idx" ON "agenda"("statusId");

-- CreateIndex
CREATE INDEX "agenda_departmentId_idx" ON "agenda"("departmentId");

-- CreateIndex
CREATE INDEX "agenda_technicianId_idx" ON "agenda"("technicianId");

-- CreateIndex
CREATE INDEX "agenda_createdById_idx" ON "agenda"("createdById");

-- CreateIndex
CREATE INDEX "agenda_assignedToId_idx" ON "agenda"("assignedToId");

-- CreateIndex
CREATE INDEX "agenda_scheduledDate_idx" ON "agenda"("scheduledDate");

-- CreateIndex
CREATE INDEX "agenda_deletedAt_idx" ON "agenda"("deletedAt");

-- CreateIndex
CREATE INDEX "agenda_scheduledDate_statusId_idx" ON "agenda"("scheduledDate", "statusId");

-- CreateIndex
CREATE INDEX "agenda_media_agendaId_idx" ON "agenda_media"("agendaId");

-- CreateIndex
CREATE INDEX "agenda_media_googleDriveFileId_idx" ON "agenda_media"("googleDriveFileId");

-- CreateIndex
CREATE INDEX "agenda_media_deletedAt_idx" ON "agenda_media"("deletedAt");

-- CreateIndex
CREATE INDEX "comments_agendaId_idx" ON "comments"("agendaId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_agendaId_idx" ON "notifications"("agendaId");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "exports_requestedById_idx" ON "exports"("requestedById");

-- CreateIndex
CREATE INDEX "exports_status_idx" ON "exports"("status");

-- CreateIndex
CREATE INDEX "exports_googleDriveFileId_idx" ON "exports"("googleDriveFileId");

-- CreateIndex
CREATE INDEX "backup_logs_status_idx" ON "backup_logs"("status");

-- CreateIndex
CREATE INDEX "backup_logs_triggeredById_idx" ON "backup_logs"("triggeredById");

-- CreateIndex
CREATE INDEX "backup_logs_googleDriveFileId_idx" ON "backup_logs"("googleDriveFileId");

-- CreateIndex
CREATE INDEX "backup_logs_createdAt_idx" ON "backup_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "google_drive_files_driveFileId_key" ON "google_drive_files"("driveFileId");

-- CreateIndex
CREATE INDEX "google_drive_files_category_idx" ON "google_drive_files"("category");

-- CreateIndex
CREATE INDEX "google_drive_files_deletedAt_idx" ON "google_drive_files"("deletedAt");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_entityId_idx" ON "activity_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "settings_category_idx" ON "settings"("category");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "agenda_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "agenda_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "technicians"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_media" ADD CONSTRAINT "agenda_media_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "agenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_media" ADD CONSTRAINT "agenda_media_googleDriveFileId_fkey" FOREIGN KEY ("googleDriveFileId") REFERENCES "google_drive_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "agenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "agenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_googleDriveFileId_fkey" FOREIGN KEY ("googleDriveFileId") REFERENCES "google_drive_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_logs" ADD CONSTRAINT "backup_logs_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_logs" ADD CONSTRAINT "backup_logs_googleDriveFileId_fkey" FOREIGN KEY ("googleDriveFileId") REFERENCES "google_drive_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
