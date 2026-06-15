ALTER TABLE "Contact"
  ADD COLUMN "nextAction" TEXT,
  ADD COLUMN "nextActionDueAt" TIMESTAMP(3),
  ADD COLUMN "assignedToId" TEXT;

CREATE INDEX "Contact_assignedToId_idx" ON "Contact"("assignedToId");
CREATE INDEX "Contact_userId_nextActionDueAt_idx" ON "Contact"("userId", "nextActionDueAt");

ALTER TABLE "Contact"
  ADD CONSTRAINT "Contact_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
