-- CreateTable
CREATE TABLE "IntegrationApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationApiKey_keyHash_key" ON "IntegrationApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "IntegrationApiKey_keyPrefix_idx" ON "IntegrationApiKey"("keyPrefix");
