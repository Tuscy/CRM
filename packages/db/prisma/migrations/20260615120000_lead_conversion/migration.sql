-- CreateTable
CREATE TABLE "LeadConversion" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "package" "PackageType",
    "purchaseDate" TIMESTAMP(3),
    "agreedDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadConversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeadConversion_leadId_key" ON "LeadConversion"("leadId");

-- AddForeignKey
ALTER TABLE "LeadConversion" ADD CONSTRAINT "LeadConversion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
