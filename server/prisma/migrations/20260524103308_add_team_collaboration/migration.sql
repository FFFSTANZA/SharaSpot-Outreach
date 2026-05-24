-- CreateEnum
CREATE TYPE "OrgMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- AlterTable
ALTER TABLE "CallTask" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "ContactList" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "EmailCampaign" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "EmailTemplate" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "InboxEmail" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "InboxThread" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "McpApiKey" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "PrmSegment" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Sender" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "SenderCooldown" ADD COLUMN     "quarantinedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeOrganizationId" TEXT;

-- AlterTable
ALTER TABLE "Webhook" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgMemberRole" NOT NULL DEFAULT 'MEMBER',
    "invitedBy" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrmBulkActionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "affectedCount" INTEGER NOT NULL,
    "undoToken" TEXT,
    "undoneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrmBulkActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BounceList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "email" TEXT NOT NULL,
    "bouncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bounceCode" TEXT,
    "reason" TEXT,

    CONSTRAINT "BounceList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PrmBulkActionLog_undoToken_key" ON "PrmBulkActionLog"("undoToken");

-- CreateIndex
CREATE INDEX "PrmBulkActionLog_userId_createdAt_idx" ON "PrmBulkActionLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BounceList_userId_idx" ON "BounceList"("userId");

-- CreateIndex
CREATE INDEX "BounceList_organizationId_idx" ON "BounceList"("organizationId");

-- CreateIndex
CREATE INDEX "BounceList_email_idx" ON "BounceList"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BounceList_userId_email_key" ON "BounceList"("userId", "email");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_campaignId_timestamp_idx" ON "AnalyticsSnapshot"("campaignId", "timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_senderId_timestamp_idx" ON "AnalyticsSnapshot"("senderId", "timestamp");

-- CreateIndex
CREATE INDEX "CallTask_organizationId_idx" ON "CallTask"("organizationId");

-- CreateIndex
CREATE INDEX "Contact_organizationId_idx" ON "Contact"("organizationId");

-- CreateIndex
CREATE INDEX "ContactActivity_contactId_createdAt_idx" ON "ContactActivity"("contactId", "createdAt");

-- CreateIndex
CREATE INDEX "ContactList_organizationId_idx" ON "ContactList"("organizationId");

-- CreateIndex
CREATE INDEX "EmailCampaign_organizationId_idx" ON "EmailCampaign"("organizationId");

-- CreateIndex
CREATE INDEX "EmailJob_campaignId_status_idx" ON "EmailJob"("campaignId", "status");

-- CreateIndex
CREATE INDEX "EmailTemplate_organizationId_idx" ON "EmailTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "InboxEmail_organizationId_idx" ON "InboxEmail"("organizationId");

-- CreateIndex
CREATE INDEX "InboxEmail_senderId_fromEmail_subject_idx" ON "InboxEmail"("senderId", "fromEmail", "subject");

-- CreateIndex
CREATE INDEX "InboxThread_organizationId_idx" ON "InboxThread"("organizationId");

-- CreateIndex
CREATE INDEX "InboxThread_senderId_lastMessageAt_idx" ON "InboxThread"("senderId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "McpApiKey_organizationId_idx" ON "McpApiKey"("organizationId");

-- CreateIndex
CREATE INDEX "PrmSegment_organizationId_idx" ON "PrmSegment"("organizationId");

-- CreateIndex
CREATE INDEX "Sender_organizationId_idx" ON "Sender"("organizationId");

-- CreateIndex
CREATE INDEX "SmtpSignalLog_recipientDomain_recordedAt_idx" ON "SmtpSignalLog"("recipientDomain", "recordedAt");

-- CreateIndex
CREATE INDEX "Tag_organizationId_idx" ON "Tag"("organizationId");

-- CreateIndex
CREATE INDEX "Webhook_organizationId_idx" ON "Webhook"("organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeOrganizationId_fkey" FOREIGN KEY ("activeOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sender" ADD CONSTRAINT "Sender_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallTask" ADD CONSTRAINT "CallTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrmSegment" ADD CONSTRAINT "PrmSegment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrmBulkActionLog" ADD CONSTRAINT "PrmBulkActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactList" ADD CONSTRAINT "ContactList_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxEmail" ADD CONSTRAINT "InboxEmail_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxThread" ADD CONSTRAINT "InboxThread_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpApiKey" ADD CONSTRAINT "McpApiKey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BounceList" ADD CONSTRAINT "BounceList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BounceList" ADD CONSTRAINT "BounceList_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
