-- CreateEnum
CREATE TYPE "TrackingDomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'MISSING', 'MISMATCH', 'ERROR');

-- CreateTable
CREATE TABLE "TrackingDomainSetting" (
    "id" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "rootDomain" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "fullDomain" TEXT NOT NULL,
    "cnameTarget" TEXT NOT NULL,
    "status" "TrackingDomainStatus" NOT NULL DEFAULT 'PENDING',
    "lastCheckedAt" TIMESTAMP(3),
    "lastCheckedValue" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingDomainSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackingDomainSetting_scopeKey_key" ON "TrackingDomainSetting"("scopeKey");

-- CreateIndex
CREATE INDEX "TrackingDomainSetting_userId_idx" ON "TrackingDomainSetting"("userId");

-- CreateIndex
CREATE INDEX "TrackingDomainSetting_organizationId_idx" ON "TrackingDomainSetting"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingDomainSetting_fullDomain_key" ON "TrackingDomainSetting"("fullDomain");

-- AddForeignKey
ALTER TABLE "TrackingDomainSetting" ADD CONSTRAINT "TrackingDomainSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingDomainSetting" ADD CONSTRAINT "TrackingDomainSetting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
