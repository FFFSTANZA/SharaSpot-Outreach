-- CreateEnum
CREATE TYPE "PriorityStatus" AS ENUM ('PRIORITY_PENDING', 'PRIORITY_SENDING');

-- AlterTable
ALTER TABLE "EmailCampaign" ADD COLUMN     "isPriority" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PriorityQueueJob" (
    "id" TEXT NOT NULL,
    "emailJobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PriorityStatus" NOT NULL DEFAULT 'PRIORITY_PENDING',
    "priorityScore" INTEGER NOT NULL DEFAULT 500,
    "congestionScore" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "statusMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityQueueJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmtpSignalLog" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientDomain" TEXT NOT NULL,
    "tcpConnectMs" INTEGER NOT NULL DEFAULT 0,
    "greetingDelayMs" INTEGER NOT NULL DEFAULT 0,
    "tlsHandshakeMs" INTEGER NOT NULL DEFAULT 0,
    "mailFromMs" INTEGER NOT NULL DEFAULT 0,
    "rcptToMs" INTEGER NOT NULL DEFAULT 0,
    "dataMs" INTEGER NOT NULL DEFAULT 0,
    "congestionScore" INTEGER NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmtpSignalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorityUserQuota" (
    "userId" TEXT NOT NULL,
    "dailyCount" INTEGER NOT NULL DEFAULT 0,
    "dailyLimit" INTEGER NOT NULL DEFAULT 50,
    "dailyResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityUserQuota_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "DomainRateLimit" (
    "domain" TEXT NOT NULL,
    "hourlyCount" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainRateLimit_pkey" PRIMARY KEY ("domain")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriorityQueueJob_emailJobId_key" ON "PriorityQueueJob"("emailJobId");

-- CreateIndex
CREATE INDEX "PriorityQueueJob_userId_idx" ON "PriorityQueueJob"("userId");

-- CreateIndex
CREATE INDEX "PriorityQueueJob_status_idx" ON "PriorityQueueJob"("status");

-- CreateIndex
CREATE INDEX "PriorityQueueJob_scheduledAt_idx" ON "PriorityQueueJob"("scheduledAt");

-- CreateIndex
CREATE INDEX "SmtpSignalLog_senderId_idx" ON "SmtpSignalLog"("senderId");

-- CreateIndex
CREATE INDEX "SmtpSignalLog_recipientDomain_idx" ON "SmtpSignalLog"("recipientDomain");

-- CreateIndex
CREATE INDEX "SmtpSignalLog_recordedAt_idx" ON "SmtpSignalLog"("recordedAt");

-- CreateIndex
CREATE INDEX "PriorityUserQuota_userId_idx" ON "PriorityUserQuota"("userId");

-- CreateIndex
CREATE INDEX "DomainRateLimit_domain_idx" ON "DomainRateLimit"("domain");

-- CreateIndex
CREATE INDEX "DomainRateLimit_windowStart_idx" ON "DomainRateLimit"("windowStart");
