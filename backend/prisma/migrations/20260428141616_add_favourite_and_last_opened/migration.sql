-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "lastOpenedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WorkspaceUser" ADD COLUMN     "isFavourite" BOOLEAN NOT NULL DEFAULT false;
