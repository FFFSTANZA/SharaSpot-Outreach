/*
  Warnings:

  - The primary key for the `PriorityQueueJob` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PriorityQueueJob` table. All the data in the column will be lost.
  - You are about to drop the `Contact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContactActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContactNote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DomainRateLimit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriorityUserQuota` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ContactToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_userId_fkey";

-- DropForeignKey
ALTER TABLE "ContactActivity" DROP CONSTRAINT "ContactActivity_contactId_fkey";

-- DropForeignKey
ALTER TABLE "ContactNote" DROP CONSTRAINT "ContactNote_contactId_fkey";

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_userId_fkey";

-- DropForeignKey
ALTER TABLE "_ContactToTag" DROP CONSTRAINT "_ContactToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_ContactToTag" DROP CONSTRAINT "_ContactToTag_B_fkey";

-- DropIndex
DROP INDEX "PriorityQueueJob_emailJobId_key";

-- DropIndex
DROP INDEX "PriorityQueueJob_scheduledAt_idx";

-- AlterTable
ALTER TABLE "PriorityQueueJob" DROP CONSTRAINT "PriorityQueueJob_pkey",
DROP COLUMN "id",
ALTER COLUMN "scheduledAt" DROP DEFAULT,
ADD CONSTRAINT "PriorityQueueJob_pkey" PRIMARY KEY ("emailJobId");

-- AlterTable
ALTER TABLE "SmtpSignalLog" ALTER COLUMN "tcpConnectMs" DROP DEFAULT,
ALTER COLUMN "tcpConnectMs" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "greetingDelayMs" DROP DEFAULT,
ALTER COLUMN "greetingDelayMs" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "tlsHandshakeMs" DROP DEFAULT,
ALTER COLUMN "tlsHandshakeMs" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "mailFromMs" DROP DEFAULT,
ALTER COLUMN "mailFromMs" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "rcptToMs" DROP DEFAULT,
ALTER COLUMN "rcptToMs" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "dataMs" DROP DEFAULT,
ALTER COLUMN "dataMs" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "congestionScore" DROP DEFAULT;

-- DropTable
DROP TABLE "Contact";

-- DropTable
DROP TABLE "ContactActivity";

-- DropTable
DROP TABLE "ContactNote";

-- DropTable
DROP TABLE "DomainRateLimit";

-- DropTable
DROP TABLE "PriorityUserQuota";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "_ContactToTag";

-- DropEnum
DROP TYPE "ActivityType";

-- DropEnum
DROP TYPE "ContactStage";
