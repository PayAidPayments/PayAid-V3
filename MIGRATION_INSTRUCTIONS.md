# Migration Instructions - Multi-Currency & Tax Engine

**Date:** February 17, 2026  
**Status:** ⚠️ Database connection issue - Use manual SQL migration

---

## 🔴 **ISSUE**

Prisma migrations are failing with:
```
FATAL: Tenant or user not found
```

This is a known issue with Supabase connection pooling. Use the manual SQL migration instead.

---

## ✅ **SOLUTION: Manual SQL Migration**

### **Step 1: Run SQL Migration**

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy the contents of `MANUAL_SQL_MIGRATION_MULTI_CURRENCY_TAX.sql`
4. Paste and run the SQL script
5. Verify all tables and columns were created

### **Step 2: Generate Prisma Client**

After running the SQL migration, generate the Prisma client:

```bash
cd "d:\Cursor Projects\PayAid V3"
npx prisma generate
```

### **Step 3: Verify Migration**

Check that the following were created:

1. **Tenant table:**
   - `defaultCurrency` column (default: 'INR')
   - `supportedCurrencies` array column

2. **Invoice table:**
   - `currency` column (default: 'INR')
   - `exchangeRate` column
   - `baseCurrencyAmount` column

3. **New tables:**
   - `tax_rules` table with all columns
   - `currency_exchange_rates` table with all columns

4. **Default data:**
   - Default GST 18% tax rule created for all existing tenants

---

## 📋 **What This Migration Adds**

### **Multi-Currency Support:**
- Currency field on invoices
- Exchange rate tracking
- Base currency amount for reporting
- Tenant-level currency settings
- Exchange rate history table

### **Flexible Tax Engine:**
- TaxRule model for custom tax rules
- Support for GST, VAT, Sales Tax, Custom
- Per-item tax rates
- Customer/product-specific tax rules
- Tax exemption handling
- Default GST 18% rule for all tenants

---

## ✅ **After Migration**

1. ✅ Run `npx prisma generate`
2. ✅ Test API endpoints:
   - `GET /api/currencies`
   - `GET /api/currencies/rates`
   - `GET /api/tax/rules`
   - `POST /api/tax/calculate`
3. ✅ Create UI components (next step)
4. ✅ Update invoice forms

---

## 🚨 **Troubleshooting**

If you encounter issues:

1. **Check Supabase connection:**
   - Verify DATABASE_URL in `.env`
   - Ensure you're using the correct connection string

2. **Verify tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('tax_rules', 'currency_exchange_rates');
   ```

3. **Check columns:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'Invoice' 
   AND column_name IN ('currency', 'exchangeRate', 'baseCurrencyAmount');
   ```

4. **Regenerate Prisma client:**
   ```bash
   npx prisma generate
   ```

---

**Next Steps:** After successful migration, we'll create the UI components for currency and tax selection.
