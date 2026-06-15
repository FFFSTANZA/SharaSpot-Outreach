UPDATE "BounceList"
SET "userId" = NULL
WHERE "organizationId" IS NOT NULL;

DELETE FROM "BounceList" a
USING "BounceList" b
WHERE a.id > b.id
  AND a."organizationId" IS NOT NULL
  AND b."organizationId" = a."organizationId"
  AND b."email" = a."email";

ALTER TABLE "BounceList"
ALTER COLUMN "userId" DROP NOT NULL;

DROP INDEX IF EXISTS "BounceList_userId_email_key";

CREATE UNIQUE INDEX "BounceList_userId_email_key"
ON "BounceList"("userId", "email");

CREATE UNIQUE INDEX "BounceList_organizationId_email_key"
ON "BounceList"("organizationId", "email");
