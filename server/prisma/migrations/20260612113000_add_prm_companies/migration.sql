CREATE TABLE "PrmCompany" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "domain" TEXT NOT NULL,
    "primaryEmail" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "githubUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "techStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whoisRegistrar" TEXT,
    "whoisCreatedAt" TIMESTAMP(3),
    "whoisUpdatedAt" TIMESTAMP(3),
    "whoisExpiresAt" TIMESTAMP(3),
    "lastEnrichedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrmCompany_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrmCompany_userId_domain_key" ON "PrmCompany"("userId", "domain");
CREATE INDEX "PrmCompany_organizationId_idx" ON "PrmCompany"("organizationId");
CREATE INDEX "PrmCompany_domain_idx" ON "PrmCompany"("domain");

ALTER TABLE "PrmCompany" ADD CONSTRAINT "PrmCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrmCompany" ADD CONSTRAINT "PrmCompany_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
