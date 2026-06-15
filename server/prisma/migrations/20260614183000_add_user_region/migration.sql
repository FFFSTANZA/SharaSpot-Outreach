-- AlterTable: Add region column to User for geo-based pricing
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "region" TEXT DEFAULT 'global';
