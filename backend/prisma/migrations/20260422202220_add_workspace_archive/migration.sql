-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
