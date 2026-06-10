-- CreateEnum
CREATE TYPE "GBPPostType" AS ENUM ('STANDARD', 'EVENT', 'OFFER');

-- AlterEnum
ALTER TYPE "AnalyticsCredType" ADD VALUE 'GBP';

-- CreateTable
CREATE TABLE "GBPPost" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "googlePostId" TEXT NOT NULL,
    "type" "GBPPostType" NOT NULL,
    "summary" TEXT NOT NULL,
    "ctaType" TEXT,
    "ctaUrl" TEXT,
    "eventTitle" TEXT,
    "eventStart" TIMESTAMP(3),
    "eventEnd" TIMESTAMP(3),
    "offerTitle" TEXT,
    "offerCode" TEXT,
    "state" TEXT NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL,
    "updateTime" TIMESTAMP(3) NOT NULL,
    "searchUrl" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GBPPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GBPPost_googlePostId_key" ON "GBPPost"("googlePostId");

-- CreateIndex
CREATE INDEX "GBPPost_clientId_idx" ON "GBPPost"("clientId");

-- AddForeignKey
ALTER TABLE "GBPPost" ADD CONSTRAINT "GBPPost_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
