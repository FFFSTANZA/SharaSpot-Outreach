-- Add assignee ownership to call queue tasks.
ALTER TABLE "CallTask" ADD COLUMN "assignedToId" TEXT;

ALTER TABLE "CallTask"
ADD CONSTRAINT "CallTask_assignedToId_fkey"
FOREIGN KEY ("assignedToId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CallTask_assignedToId_idx" ON "CallTask"("assignedToId");
