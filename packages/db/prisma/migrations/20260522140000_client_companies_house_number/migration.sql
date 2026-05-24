-- AlterTable
ALTER TABLE "Client" ADD COLUMN "companiesHouseNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_companiesHouseNumber_key" ON "Client"("companiesHouseNumber");
