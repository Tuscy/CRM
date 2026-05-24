-- AlterTable
ALTER TABLE "Client" ADD COLUMN "companyName" TEXT,
ADD COLUMN "industry" TEXT,
ADD COLUMN "services" TEXT,
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "contactAddress" TEXT,
ADD COLUMN "billingPeriod" TEXT,
ADD COLUMN "billingPrice" DECIMAL(12,2),
ADD COLUMN "billingCurrency" TEXT DEFAULT 'USD',
ADD COLUMN "billingNotes" TEXT;
