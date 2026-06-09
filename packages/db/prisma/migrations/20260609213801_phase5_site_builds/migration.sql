-- CreateEnum
CREATE TYPE "ContentMode" AS ENUM ('LOCAL', 'SANITY');

-- CreateEnum
CREATE TYPE "SiteBuildStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETE', 'PAUSED');

-- CreateTable
CREATE TABLE "SiteBuild" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "repoName" TEXT,
    "figmaUrl" TEXT,
    "contentMode" "ContentMode" NOT NULL DEFAULT 'LOCAL',
    "sanityProjectId" TEXT,
    "sanityDataset" TEXT,
    "requiredRoutes" TEXT,
    "notes" TEXT,
    "status" "SiteBuildStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStage" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteBuild_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteBuild_clientId_idx" ON "SiteBuild"("clientId");

-- AddForeignKey
ALTER TABLE "SiteBuild" ADD CONSTRAINT "SiteBuild_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteBuild" ADD CONSTRAINT "SiteBuild_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
