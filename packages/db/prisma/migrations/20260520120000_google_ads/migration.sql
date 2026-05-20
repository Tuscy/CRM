-- CreateTable
CREATE TABLE "GoogleAdsSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "loginCustomerId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleAdsSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleAdsConnection" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "googleAdsCustomerId" TEXT NOT NULL,
    "label" TEXT,
    "displayName" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleAdsConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleAdsAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "customerId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "execute" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleAdsAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAdsConnection_googleAdsCustomerId_key" ON "GoogleAdsConnection"("googleAdsCustomerId");

-- CreateIndex
CREATE INDEX "GoogleAdsConnection_clientId_idx" ON "GoogleAdsConnection"("clientId");

-- CreateIndex
CREATE INDEX "GoogleAdsAuditLog_customerId_idx" ON "GoogleAdsAuditLog"("customerId");

-- CreateIndex
CREATE INDEX "GoogleAdsAuditLog_createdAt_idx" ON "GoogleAdsAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "GoogleAdsConnection" ADD CONSTRAINT "GoogleAdsConnection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
