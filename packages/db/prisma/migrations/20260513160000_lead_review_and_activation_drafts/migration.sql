-- Lead Intelligence M1: human review queue + draft-first activation drafts (dashboard).
CREATE TYPE "LeadReviewRecordType" AS ENUM ('LEAD_ACCOUNT', 'LEAD_CONTACT');
CREATE TYPE "LeadReviewDisposition" AS ENUM ('OPEN', 'APPROVED', 'REJECTED');
CREATE TYPE "LeadActivationDraftStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED', 'SUBMITTED');

CREATE TABLE "lead_review_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recordType" "LeadReviewRecordType" NOT NULL,
    "leadAccountId" TEXT,
    "leadContactId" TEXT,
    "disposition" "LeadReviewDisposition" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdById" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_review_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_review_items_tenantId_disposition_updatedAt_idx" ON "lead_review_items"("tenantId", "disposition", "updatedAt");

ALTER TABLE "lead_review_items" ADD CONSTRAINT "lead_review_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_review_items" ADD CONSTRAINT "lead_review_items_leadAccountId_fkey" FOREIGN KEY ("leadAccountId") REFERENCES "LeadAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_review_items" ADD CONSTRAINT "lead_review_items_leadContactId_fkey" FOREIGN KEY ("leadContactId") REFERENCES "LeadContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lead_activation_drafts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "status" "LeadActivationDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "leadReviewItemId" TEXT,
    "payload" JSONB NOT NULL,
    "createdById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_activation_drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_activation_drafts_tenantId_status_updatedAt_idx" ON "lead_activation_drafts"("tenantId", "status", "updatedAt");

ALTER TABLE "lead_activation_drafts" ADD CONSTRAINT "lead_activation_drafts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_activation_drafts" ADD CONSTRAINT "lead_activation_drafts_leadReviewItemId_fkey" FOREIGN KEY ("leadReviewItemId") REFERENCES "lead_review_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
