-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "SystemAuditLog" (
    "id" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedWebhook" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemAuditLog_level_idx" ON "SystemAuditLog"("level");
CREATE INDEX "SystemAuditLog_category_idx" ON "SystemAuditLog"("category");
CREATE INDEX "SystemAuditLog_createdAt_idx" ON "SystemAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedWebhook_eventId_key" ON "ProcessedWebhook"("eventId");
CREATE INDEX "ProcessedWebhook_eventId_idx" ON "ProcessedWebhook"("eventId");
