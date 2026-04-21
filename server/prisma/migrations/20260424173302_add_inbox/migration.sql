-- CreateEnum
CREATE TYPE "SnapshotType" AS ENUM ('HOURLY', 'DAILY');

-- CreateEnum
CREATE TYPE "InboxConnectionType" AS ENUM ('IMAP', 'GMAIL_API', 'MICROSOFT_GRAPH');

-- CreateEnum
CREATE TYPE "InboxSyncStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- AlterEnum
ALTER TYPE "TrackingEventType" ADD VALUE 'BOUNCE';

-- AlterTable
ALTER TABLE "EmailCampaign" ADD COLUMN     "replyTo" TEXT;

-- AlterTable
ALTER TABLE "Sender" ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "connectionType" "InboxConnectionType" NOT NULL DEFAULT 'IMAP',
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "replyTo" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TrackingEvent" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "isBot" BOOLEAN,
ADD COLUMN     "isDesktop" BOOLEAN,
ADD COLUMN     "isMobile" BOOLEAN,
ADD COLUMN     "platform" TEXT,
ADD COLUMN     "trackingToken" TEXT,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- CreateTable
CREATE TABLE "ContactList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "senderId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "SnapshotType" NOT NULL DEFAULT 'HOURLY',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "bounceCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySenderHealth" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "bounceCount" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" JSONB,

    CONSTRAINT "DailySenderHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "events" TEXT[],
    "secret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboxEmail" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "inReplyTo" TEXT,
    "references" TEXT,
    "threadId" TEXT,
    "fromName" TEXT,
    "fromEmail" TEXT NOT NULL,
    "toName" TEXT,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "snippet" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "folder" TEXT NOT NULL DEFAULT 'INBOX',
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedBy" TEXT,

    CONSTRAINT "InboxEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboxThread" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "participants" TEXT[],
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "lastSnippet" TEXT,
    "lastSenderEmail" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InboxThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboxSyncJob" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "status" "InboxSyncStatus" NOT NULL DEFAULT 'PENDING',
    "messagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboxSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContactToContactList" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContactToContactList_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "ContactList_userId_idx" ON "ContactList"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactList_userId_name_key" ON "ContactList"("userId", "name");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_campaignId_idx" ON "AnalyticsSnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_senderId_idx" ON "AnalyticsSnapshot"("senderId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_timestamp_idx" ON "AnalyticsSnapshot"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSnapshot_campaignId_senderId_timestamp_type_key" ON "AnalyticsSnapshot"("campaignId", "senderId", "timestamp", "type");

-- CreateIndex
CREATE UNIQUE INDEX "DailySenderHealth_senderId_date_key" ON "DailySenderHealth"("senderId", "date");

-- CreateIndex
CREATE INDEX "Webhook_userId_idx" ON "Webhook"("userId");

-- CreateIndex
CREATE INDEX "Webhook_isActive_idx" ON "Webhook"("isActive");

-- CreateIndex
CREATE INDEX "WebhookDelivery_webhookId_idx" ON "WebhookDelivery"("webhookId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_createdAt_idx" ON "WebhookDelivery"("createdAt");

-- CreateIndex
CREATE INDEX "InboxEmail_senderId_idx" ON "InboxEmail"("senderId");

-- CreateIndex
CREATE INDEX "InboxEmail_threadId_idx" ON "InboxEmail"("threadId");

-- CreateIndex
CREATE INDEX "InboxEmail_receivedAt_idx" ON "InboxEmail"("receivedAt");

-- CreateIndex
CREATE INDEX "InboxEmail_toEmail_idx" ON "InboxEmail"("toEmail");

-- CreateIndex
CREATE UNIQUE INDEX "InboxEmail_senderId_messageId_key" ON "InboxEmail"("senderId", "messageId");

-- CreateIndex
CREATE INDEX "InboxThread_senderId_idx" ON "InboxThread"("senderId");

-- CreateIndex
CREATE INDEX "InboxThread_lastMessageAt_idx" ON "InboxThread"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "InboxThread_senderId_threadId_key" ON "InboxThread"("senderId", "threadId");

-- CreateIndex
CREATE INDEX "InboxSyncJob_senderId_idx" ON "InboxSyncJob"("senderId");

-- CreateIndex
CREATE INDEX "InboxSyncJob_status_idx" ON "InboxSyncJob"("status");

-- CreateIndex
CREATE INDEX "_ContactToContactList_B_index" ON "_ContactToContactList"("B");

-- CreateIndex
CREATE INDEX "TrackingEvent_createdAt_idx" ON "TrackingEvent"("createdAt");

-- CreateIndex
CREATE INDEX "TrackingEvent_platform_idx" ON "TrackingEvent"("platform");

-- CreateIndex
CREATE INDEX "TrackingEvent_trackingToken_idx" ON "TrackingEvent"("trackingToken");

-- AddForeignKey
ALTER TABLE "ContactList" ADD CONSTRAINT "ContactList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySenderHealth" ADD CONSTRAINT "DailySenderHealth_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxEmail" ADD CONSTRAINT "InboxEmail_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxThread" ADD CONSTRAINT "InboxThread_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxSyncJob" ADD CONSTRAINT "InboxSyncJob_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToContactList" ADD CONSTRAINT "_ContactToContactList_A_fkey" FOREIGN KEY ("A") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToContactList" ADD CONSTRAINT "_ContactToContactList_B_fkey" FOREIGN KEY ("B") REFERENCES "ContactList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
