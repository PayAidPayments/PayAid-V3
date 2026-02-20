-- Migration Verification Script
-- Run this in Supabase SQL Editor to verify multi-currency and tax engine migration

-- 1. Check Tenant currency fields
SELECT 
  "id", 
  "name", 
  "defaultCurrency", 
  "supportedCurrencies" 
FROM "Tenant" 
LIMIT 5;

-- 2. Check Invoice currency fields  
SELECT 
  "id", 
  "invoiceNumber", 
  "currency",
  "exchangeRate",
  "baseCurrencyAmount"
FROM "Invoice" 
LIMIT 5;

-- 3. Check tax_rules table exists and count
SELECT COUNT(*) as tax_rules_count FROM "tax_rules";

-- 4. Check currency_exchange_rates table exists and count
SELECT COUNT(*) as exchange_rates_count FROM "currency_exchange_rates";

-- 5. Check if tax_rules table has the correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tax_rules'
ORDER BY ordinal_position;

-- 6. Check if currency_exchange_rates table has the correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'currency_exchange_rates'
ORDER BY ordinal_position;

-- 7. Check for any default tax rules created
SELECT 
  "id",
  "name",
  "taxType",
  "rate",
  "isDefault",
  "isActive"
FROM "tax_rules"
WHERE "isDefault" = true;

-- 8. Verify Tenant table has currency columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'Tenant' 
  AND column_name IN ('defaultCurrency', 'supportedCurrencies')
ORDER BY ordinal_position;

-- 9. Verify Invoice table has currency columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'Invoice' 
  AND column_name IN ('currency', 'exchangeRate', 'baseCurrencyAmount')
ORDER BY ordinal_position;
