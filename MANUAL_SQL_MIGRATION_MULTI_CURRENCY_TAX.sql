-- Manual SQL Migration: Multi-Currency Support and Flexible Tax Engine
-- Date: February 17, 2026
-- Run this in Supabase SQL Editor if Prisma migrations fail

-- ============================================
-- 1. ADD CURRENCY FIELDS TO TENANT TABLE
-- ============================================

-- Add defaultCurrency column
ALTER TABLE "Tenant" 
ADD COLUMN IF NOT EXISTS "defaultCurrency" TEXT NOT NULL DEFAULT 'INR';

-- Add supportedCurrencies array column
ALTER TABLE "Tenant" 
ADD COLUMN IF NOT EXISTS "supportedCurrencies" TEXT[] DEFAULT ARRAY['INR']::TEXT[];

-- ============================================
-- 2. ADD CURRENCY FIELDS TO INVOICE TABLE
-- ============================================

-- Add currency column
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR';

-- Add exchangeRate column (nullable, for multi-currency invoices)
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "exchangeRate" DOUBLE PRECISION;

-- Add baseCurrencyAmount column (amount in base currency for reporting)
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "baseCurrencyAmount" DOUBLE PRECISION;

-- ============================================
-- 3. CREATE TAX_RULES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "tax_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxType" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "appliesTo" TEXT NOT NULL DEFAULT 'all',
    "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isExempt" BOOLEAN NOT NULL DEFAULT false,
    "exemptionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rules_pkey" PRIMARY KEY ("id")
);

-- Create indexes for tax_rules
CREATE INDEX IF NOT EXISTS "tax_rules_tenantId_idx" ON "tax_rules"("tenantId");
CREATE INDEX IF NOT EXISTS "tax_rules_tenantId_isActive_idx" ON "tax_rules"("tenantId", "isActive");
CREATE INDEX IF NOT EXISTS "tax_rules_tenantId_taxType_idx" ON "tax_rules"("tenantId", "taxType");

-- Add foreign key constraint
ALTER TABLE "tax_rules" 
ADD CONSTRAINT "tax_rules_tenantId_fkey" 
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 4. CREATE CURRENCY_EXCHANGE_RATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "currency_exchange_rates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "rateDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currency_exchange_rates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "currency_exchange_rates_fromCurrency_toCurrency_rateDate_tenantId_key" UNIQUE ("fromCurrency", "toCurrency", "rateDate", "tenantId")
);

-- Create indexes for currency_exchange_rates
CREATE INDEX IF NOT EXISTS "currency_exchange_rates_fromCurrency_toCurrency_rateDate_idx" 
ON "currency_exchange_rates"("fromCurrency", "toCurrency", "rateDate");
CREATE INDEX IF NOT EXISTS "currency_exchange_rates_tenantId_idx" 
ON "currency_exchange_rates"("tenantId");

-- Add foreign key constraint (nullable tenantId)
ALTER TABLE "currency_exchange_rates" 
ADD CONSTRAINT "currency_exchange_rates_tenantId_fkey" 
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 5. CREATE DEFAULT TAX RULES FOR EXISTING TENANTS
-- ============================================

-- Insert default GST 18% rule for all existing tenants
INSERT INTO "tax_rules" (
    "id",
    "tenantId",
    "name",
    "taxType",
    "rate",
    "isDefault",
    "appliesTo",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT 
    'tax_' || "id" || '_gst_18' as "id",
    "id" as "tenantId",
    'GST 18%' as "name",
    'GST' as "taxType",
    18.0 as "rate",
    true as "isDefault",
    'all' as "appliesTo",
    true as "isActive",
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
FROM "Tenant"
WHERE NOT EXISTS (
    SELECT 1 FROM "tax_rules" WHERE "tax_rules"."tenantId" = "Tenant"."id" AND "tax_rules"."isDefault" = true
);

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

-- Verify Tenant currency fields
SELECT "id", "name", "defaultCurrency", "supportedCurrencies" 
FROM "Tenant" 
LIMIT 5;

-- Verify Invoice currency fields
SELECT "id", "invoiceNumber", "currency", "exchangeRate", "baseCurrencyAmount" 
FROM "Invoice" 
LIMIT 5;

-- Verify tax_rules table
SELECT COUNT(*) as "tax_rules_count" FROM "tax_rules";

-- Verify currency_exchange_rates table
SELECT COUNT(*) as "exchange_rates_count" FROM "currency_exchange_rates";

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- After running this migration:
-- 1. Run: npx prisma generate
-- 2. Test the new API endpoints
-- 3. Create UI components for currency and tax selection
