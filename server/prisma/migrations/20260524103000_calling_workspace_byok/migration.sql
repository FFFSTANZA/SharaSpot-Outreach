-- Calling workspace BYOK foundation
ALTER TABLE "User" ADD COLUMN "callingEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "CallTask"
  ADD COLUMN "lastDisposition" TEXT,
  ADD COLUMN "campaignId" TEXT,
  ADD COLUMN "contactListId" TEXT,
  ADD COLUMN "prmSegmentId" TEXT;

-- Create missing PRM tables not in prior migrations
CREATE TABLE "PrmSegment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expression" JSONB NOT NULL,
    "isAdhoc" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PrmSegment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrmSegmentContact" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrmSegmentContact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrmSegment_userId_name_key" ON "PrmSegment"("userId", "name");
CREATE INDEX "PrmSegment_userId_idx" ON "PrmSegment"("userId");

CREATE UNIQUE INDEX "PrmSegmentContact_segmentId_contactId_key" ON "PrmSegmentContact"("segmentId", "contactId");
CREATE INDEX "PrmSegmentContact_segmentId_idx" ON "PrmSegmentContact"("segmentId");
CREATE INDEX "PrmSegmentContact_contactId_idx" ON "PrmSegmentContact"("contactId");

ALTER TABLE "PrmSegment" ADD CONSTRAINT "PrmSegment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PrmSegmentContact" ADD CONSTRAINT "PrmSegmentContact_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "PrmSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrmSegmentContact" ADD CONSTRAINT "PrmSegmentContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "CallProviderType" AS ENUM ('SIP_WEBRTC');
CREATE TYPE "CallProviderStatus" AS ENUM ('CONNECTED', 'FAILED', 'REQUIRES_ATTENTION', 'DISCONNECTED');
CREATE TYPE "CallSessionMode" AS ENUM ('MANUAL', 'CONNECTED');
CREATE TYPE "CallDirection" AS ENUM ('OUTBOUND', 'INBOUND');

CREATE TABLE "CallProviderConnection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "CallProviderType" NOT NULL DEFAULT 'SIP_WEBRTC',
  "name" TEXT NOT NULL,
  "sipUsernameEnc" TEXT NOT NULL,
  "sipPasswordEnc" TEXT NOT NULL,
  "sipDomain" TEXT NOT NULL,
  "websocketUrl" TEXT NOT NULL,
  "displayName" TEXT,
  "vendorMetadata" JSONB,
  "status" "CallProviderStatus" NOT NULL DEFAULT 'REQUIRES_ATTENTION',
  "lastCheckedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CallProviderConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CallSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "contactId" TEXT,
  "taskId" TEXT,
  "providerConnectionId" TEXT,
  "mode" "CallSessionMode" NOT NULL DEFAULT 'MANUAL',
  "direction" "CallDirection" NOT NULL DEFAULT 'OUTBOUND',
  "providerCallId" TEXT,
  "outcome" TEXT,
  "note" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "durationSeconds" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CallSession_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CallTask"
  ADD CONSTRAINT "CallTask_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CallTask"
  ADD CONSTRAINT "CallTask_contactListId_fkey"
  FOREIGN KEY ("contactListId") REFERENCES "ContactList"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CallTask"
  ADD CONSTRAINT "CallTask_prmSegmentId_fkey"
  FOREIGN KEY ("prmSegmentId") REFERENCES "PrmSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CallProviderConnection"
  ADD CONSTRAINT "CallProviderConnection_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CallSession"
  ADD CONSTRAINT "CallSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallSession"
  ADD CONSTRAINT "CallSession_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CallSession"
  ADD CONSTRAINT "CallSession_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "CallTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CallSession"
  ADD CONSTRAINT "CallSession_providerConnectionId_fkey"
  FOREIGN KEY ("providerConnectionId") REFERENCES "CallProviderConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CallTask_campaignId_idx" ON "CallTask"("campaignId");
CREATE INDEX "CallTask_contactListId_idx" ON "CallTask"("contactListId");
CREATE INDEX "CallTask_prmSegmentId_idx" ON "CallTask"("prmSegmentId");

CREATE INDEX "CallProviderConnection_userId_idx" ON "CallProviderConnection"("userId");
CREATE INDEX "CallProviderConnection_userId_status_idx" ON "CallProviderConnection"("userId", "status");

CREATE INDEX "CallSession_userId_idx" ON "CallSession"("userId");
CREATE INDEX "CallSession_contactId_idx" ON "CallSession"("contactId");
CREATE INDEX "CallSession_taskId_idx" ON "CallSession"("taskId");
CREATE INDEX "CallSession_providerConnectionId_idx" ON "CallSession"("providerConnectionId");
CREATE INDEX "CallSession_userId_startedAt_idx" ON "CallSession"("userId", "startedAt");
