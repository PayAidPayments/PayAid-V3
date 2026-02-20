# Migration Verification Guide

## Quick Verification Queries

Run these queries in your Supabase SQL Editor to verify the migration was successful:

### 1. Check Tenant Currency Fields
```sql
SELECT "id", "name", "defaultCurrency", "supportedCurrencies" FROM "Tenant" LIMIT 5;
```

**Expected Result:**
- Should show `defaultCurrency` column (default: 'INR')
- Should show `supportedCurrencies` column (default: ['INR'])

### 2. Check Invoice Currency Fields
```sql
SELECT "id", "invoiceNumber", "currency", "exchangeRate", "baseCurrencyAmount" FROM "Invoice" LIMIT 5;
```

**Expected Result:**
- Should show `currency` column (default: 'INR')
- Should show `exchangeRate` column (nullable)
- Should show `baseCurrencyAmount` column (nullable)

### 3. Check Tax Rules Table
```sql
SELECT COUNT(*) FROM "tax_rules";
```

**Expected Result:**
- Should return a count (may be 0 if no rules created yet)
- If migration included default rules, should show count > 0

### 4. Check Currency Exchange Rates Table
```sql
SELECT COUNT(*) FROM "currency_exchange_rates";
```

**Expected Result:**
- Should return a count (may be 0 if no rates fetched yet)

## Detailed Verification

For a complete verification, run the script:
```bash
# Copy and paste the contents of scripts/verify-migration.sql into Supabase SQL Editor
```

Or run individual queries:

### Check Table Structures
```sql
-- Tax Rules Structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tax_rules'
ORDER BY ordinal_position;

-- Currency Exchange Rates Structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'currency_exchange_rates'
ORDER BY ordinal_position;
```

### Check Default Tax Rules
```sql
SELECT "id", "name", "taxType", "rate", "isDefault", "isActive"
FROM "tax_rules"
WHERE "isDefault" = true;
```

## Troubleshooting

### If columns are missing:
1. Check if you ran the migration script (`MANUAL_SQL_MIGRATION_MULTI_CURRENCY_TAX.sql`)
2. Verify you're connected to the correct database
3. Check for any error messages in Supabase SQL Editor

### If tables don't exist:
1. Ensure the migration script was executed completely
2. Check Supabase logs for any errors
3. Verify database connection permissions

### If Prisma Client is out of sync:
After verifying database changes, run:
```bash
npx prisma generate
```

This will regenerate the Prisma client to match your database schema.

## Next Steps

After verification:
1. ✅ Database schema updated
2. ✅ Prisma client generated (`npx prisma generate`)
3. ✅ UI components created
4. ✅ API endpoints updated
5. ⏭️ Test invoice creation with multi-currency
6. ⏭️ Test tax rule creation and application
7. ⏭️ Test currency conversion
