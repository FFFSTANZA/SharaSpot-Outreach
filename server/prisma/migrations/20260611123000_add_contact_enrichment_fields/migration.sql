ALTER TABLE "Contact"
ADD COLUMN "website" TEXT,
ADD COLUMN "companyDomain" TEXT,
ADD COLUMN "techStack" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "lastEnrichedAt" TIMESTAMP(3);

CREATE INDEX "Contact_companyDomain_idx" ON "Contact"("companyDomain");
