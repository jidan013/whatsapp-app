/*
  Warnings:

  - The values [LOW,MEDIUM,HIGH] on the enum `AgendaPriority` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AgendaPriority_new" AS ENUM ('RENDAH', 'SEDANG', 'TINGGI', 'URGENT');
ALTER TABLE "public"."agenda" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "agenda" ALTER COLUMN "priority" TYPE "AgendaPriority_new" USING ("priority"::text::"AgendaPriority_new");
ALTER TYPE "AgendaPriority" RENAME TO "AgendaPriority_old";
ALTER TYPE "AgendaPriority_new" RENAME TO "AgendaPriority";
DROP TYPE "public"."AgendaPriority_old";
ALTER TABLE "agenda" ALTER COLUMN "priority" SET DEFAULT 'SEDANG';
COMMIT;

-- AlterTable
ALTER TABLE "agenda" ALTER COLUMN "priority" SET DEFAULT 'SEDANG';
