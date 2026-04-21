/*
  Warnings:

  - You are about to drop the column `direction` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `entryPrice` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `exitPrice` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `pnl` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `symbol` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `tradeDate` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `JournalEntry` table. All the data in the column will be lost.
  - Added the required column `journalId` to the `JournalEntry` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "JournalEntry" DROP CONSTRAINT "JournalEntry_userId_fkey";

-- AlterTable
ALTER TABLE "JournalEntry" DROP COLUMN "direction",
DROP COLUMN "entryPrice",
DROP COLUMN "exitPrice",
DROP COLUMN "notes",
DROP COLUMN "pnl",
DROP COLUMN "size",
DROP COLUMN "symbol",
DROP COLUMN "tags",
DROP COLUMN "tradeDate",
DROP COLUMN "userId",
ADD COLUMN     "data" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "journalId" TEXT NOT NULL,
ADD COLUMN     "rowOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "columns" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
