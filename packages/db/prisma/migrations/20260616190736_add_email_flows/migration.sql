-- CreateEnum
CREATE TYPE "EmailFlowTrigger" AS ENUM ('LEAD_CREATED', 'LEAD_STATUS_CHANGED', 'DEAL_CREATED', 'DEAL_STAGE_CHANGED', 'CLIENT_CREATED', 'TASK_COMPLETED', 'MANUAL');

-- CreateEnum
CREATE TYPE "EmailFlowEnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "EmailFlow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" "EmailFlowTrigger" NOT NULL,
    "triggerConfig" JSONB,
    "steps" JSONB NOT NULL,
    "n8nWorkflowId" TEXT,
    "n8nWebhookPath" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailFlowEnrollment" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "leadId" TEXT,
    "clientId" TEXT,
    "status" "EmailFlowEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "n8nExecutionId" TEXT,
    "contactSnapshot" JSONB,

    CONSTRAINT "EmailFlowEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailFlowSend" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "resendMessageId" TEXT,
    "subject" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "complainedAt" TIMESTAMP(3),

    CONSTRAINT "EmailFlowSend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailFlowTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "variables" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailFlowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailFlowEnrollment_flowId_idx" ON "EmailFlowEnrollment"("flowId");

-- CreateIndex
CREATE INDEX "EmailFlowEnrollment_leadId_idx" ON "EmailFlowEnrollment"("leadId");

-- CreateIndex
CREATE INDEX "EmailFlowEnrollment_clientId_idx" ON "EmailFlowEnrollment"("clientId");

-- CreateIndex
CREATE INDEX "EmailFlowEnrollment_status_idx" ON "EmailFlowEnrollment"("status");

-- CreateIndex
CREATE INDEX "EmailFlowSend_enrollmentId_idx" ON "EmailFlowSend"("enrollmentId");

-- CreateIndex
CREATE INDEX "EmailFlowSend_resendMessageId_idx" ON "EmailFlowSend"("resendMessageId");

-- AddForeignKey
ALTER TABLE "EmailFlowEnrollment" ADD CONSTRAINT "EmailFlowEnrollment_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "EmailFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailFlowSend" ADD CONSTRAINT "EmailFlowSend_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "EmailFlowEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
