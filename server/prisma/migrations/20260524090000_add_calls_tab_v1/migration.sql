-- Add optional phone field to contacts
ALTER TABLE "Contact" ADD COLUMN "phone" TEXT;

-- Create enum for call task status
CREATE TYPE "CallTaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED');

-- Create call task table
CREATE TABLE "CallTask" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "status" "CallTaskStatus" NOT NULL DEFAULT 'PENDING',
  "priority" INTEGER NOT NULL DEFAULT 0,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "lastOutcome" TEXT,
  "lastNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CallTask_pkey" PRIMARY KEY ("id")
);

-- FK constraints
ALTER TABLE "CallTask"
  ADD CONSTRAINT "CallTask_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CallTask"
  ADD CONSTRAINT "CallTask_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "CallTask_userId_status_dueAt_idx" ON "CallTask"("userId", "status", "dueAt");
CREATE INDEX "CallTask_contactId_idx" ON "CallTask"("contactId");
CREATE INDEX "CallTask_userId_dueAt_idx" ON "CallTask"("userId", "dueAt");
