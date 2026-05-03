-- Manual SQL Migration: Customer Insights Model
-- Date: February 17, 2026
-- Run this in Supabase SQL Editor if Prisma migrations fail

-- ============================================
-- CREATE CUSTOMER_INSIGHTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "customer_insights" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    
    -- Health Score (0-100)
    "healthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "healthScoreComponents" JSONB,
    
    -- Churn Prediction
    "churnRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "churnRiskLevel" TEXT NOT NULL DEFAULT 'low',
    "churnReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "churnPredictionDate" TIMESTAMP(3),
    
    -- Lifetime Value
    "lifetimeValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "predictedLTV" DOUBLE PRECISION,
    "averageOrderValue" DOUBLE PRECISION,
    "purchaseFrequency" DOUBLE PRECISION,
    
    -- Engagement Metrics
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "activityCount" INTEGER NOT NULL DEFAULT 0,
    "responseRate" DOUBLE PRECISION,
    
    -- Payment Metrics
    "paymentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageDaysToPay" DOUBLE PRECISION,
    "onTimePaymentRate" DOUBLE PRECISION,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOutstanding" DOUBLE PRECISION NOT NULL DEFAULT 0,
    
    -- Support Metrics
    "supportScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ticketCount" INTEGER NOT NULL DEFAULT 0,
    "averageResolutionTime" DOUBLE PRECISION,
    "satisfactionScore" DOUBLE PRECISION,
    
    -- Recommendations
    "recommendedActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nextBestAction" TEXT,
    
    -- Metadata
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculationVersion" TEXT NOT NULL DEFAULT '1.0',
    "metadata" JSONB DEFAULT '{}'::jsonb,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "customer_insights_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "customer_insights_contactId_tenantId_key" 
ON "customer_insights"("contactId", "tenantId");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "customer_insights_tenantId_idx" ON "customer_insights"("tenantId");
CREATE INDEX IF NOT EXISTS "customer_insights_contactId_idx" ON "customer_insights"("contactId");
CREATE INDEX IF NOT EXISTS "customer_insights_tenantId_churnRiskLevel_idx" 
ON "customer_insights"("tenantId", "churnRiskLevel");
CREATE INDEX IF NOT EXISTS "customer_insights_tenantId_healthScore_idx" 
ON "customer_insights"("tenantId", "healthScore");
CREATE INDEX IF NOT EXISTS "customer_insights_lastCalculatedAt_idx" 
ON "customer_insights"("lastCalculatedAt");

-- Add foreign key constraints
ALTER TABLE "customer_insights" 
ADD CONSTRAINT "customer_insights_contactId_fkey" 
FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_insights" 
ADD CONSTRAINT "customer_insights_tenantId_fkey" 
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_customer_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_insights_updated_at
BEFORE UPDATE ON "customer_insights"
FOR EACH ROW
EXECUTE FUNCTION update_customer_insights_updated_at();

-- Verify table creation
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_insights'
ORDER BY ordinal_position;
