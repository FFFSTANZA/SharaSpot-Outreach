-- CreateTable
CREATE TABLE "PriorityUserQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyCount" INTEGER NOT NULL DEFAULT 0,
    "dailyLimit" INTEGER NOT NULL DEFAULT 50,
    "dailyResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityUserQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainRateLimit" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "hourlyCount" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriorityUserQuota_userId_key" ON "PriorityUserQuota"("userId");

-- CreateIndex
CREATE INDEX "PriorityUserQuota_userId_idx" ON "PriorityUserQuota"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DomainRateLimit_domain_key" ON "DomainRateLimit"("domain");

-- CreateIndex
CREATE INDEX "DomainRateLimit_domain_idx" ON "DomainRateLimit"("domain");
