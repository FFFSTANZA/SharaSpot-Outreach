/*
  Warnings:

  - You are about to drop the column `lastSummarizedAt` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `semanticSummary` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the `AiUsage` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `minuteWindow` on table `RateLimitCounter` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AiUsage" DROP CONSTRAINT "AiUsage_userId_fkey";

-- DropIndex
DROP INDEX "DomainRateLimit_domain_idx";

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "lastSummarizedAt",
DROP COLUMN "semanticSummary";

-- AlterTable
ALTER TABLE "RateLimitCounter" ALTER COLUMN "minuteWindow" SET NOT NULL,
ALTER COLUMN "minuteWindow" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "AiUsage";

-- CreateTable
CREATE TABLE "McpApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "McpApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "McpApiKey_keyHash_key" ON "McpApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "McpApiKey_userId_idx" ON "McpApiKey"("userId");

-- CreateIndex
CREATE INDEX "McpApiKey_keyHash_idx" ON "McpApiKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "McpApiKey_userId_name_key" ON "McpApiKey"("userId", "name");

-- CreateIndex
CREATE INDEX "Contact_userId_email_idx" ON "Contact"("userId", "email");

-- CreateIndex
CREATE INDEX "Contact_userId_stage_idx" ON "Contact"("userId", "stage");

-- CreateIndex
CREATE INDEX "ContactActivity_createdAt_idx" ON "ContactActivity"("createdAt");

-- CreateIndex
CREATE INDEX "DailySenderHealth_senderId_idx" ON "DailySenderHealth"("senderId");

-- CreateIndex
CREATE INDEX "EmailJob_createdAt_idx" ON "EmailJob"("createdAt");

-- CreateIndex
CREATE INDEX "InboxEmail_senderId_receivedAt_idx" ON "InboxEmail"("senderId", "receivedAt");

-- CreateIndex
CREATE INDEX "PriorityQueueJob_userId_scheduledAt_idx" ON "PriorityQueueJob"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "SmtpSignalLog_senderId_recordedAt_idx" ON "SmtpSignalLog"("senderId", "recordedAt");

-- CreateIndex
CREATE INDEX "Webhook_userId_isActive_idx" ON "Webhook"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "McpApiKey" ADD CONSTRAINT "McpApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
