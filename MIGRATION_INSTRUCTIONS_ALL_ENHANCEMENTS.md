# Migration Instructions - All Enhancements

**Date:** February 17, 2026  
**Status:** Ready for Migration

---

## 🗄️ **DATABASE MIGRATION STEPS**

### **Step 1: Run Manual SQL Migration**

Since Prisma migrations fail with Supabase connection pooling, run the SQL script directly:

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run Customer Insights Migration:**
   - Copy contents of `MANUAL_SQL_MIGRATION_CUSTOMER_INSIGHTS.sql`
   - Paste into SQL Editor
   - Click "Run" or press Ctrl+Enter

3. **Verify Migration:**
   ```sql
   -- Check if table exists
   SELECT COUNT(*) FROM "customer_insights";
   
   -- Check table structure
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'customer_insights';
   ```

### **Step 2: Generate Prisma Client**

After SQL migration, generate Prisma client:

```bash
npx prisma generate
```

This will update your Prisma client to include the new `CustomerInsight` model.

---

## ✅ **VERIFICATION QUERIES**

Run these queries to verify all migrations:

### **1. Check Customer Insights Table**
```sql
SELECT COUNT(*) FROM "customer_insights";
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customer_insights'
ORDER BY ordinal_position;
```

### **2. Check Currency Fields**
```sql
SELECT "id", "name", "defaultCurrency", "supportedCurrencies" 
FROM "Tenant" LIMIT 5;

SELECT "id", "invoiceNumber", "currency", "exchangeRate" 
FROM "Invoice" LIMIT 5;
```

### **3. Check Tax Rules Table**
```sql
SELECT COUNT(*) FROM "tax_rules";
SELECT "id", "name", "taxType", "rate", "isDefault" 
FROM "tax_rules" LIMIT 5;
```

### **4. Check Currency Exchange Rates Table**
```sql
SELECT COUNT(*) FROM "currency_exchange_rates";
SELECT "fromCurrency", "toCurrency", "rate", "rateDate" 
FROM "currency_exchange_rates" 
ORDER BY "rateDate" DESC LIMIT 5;
```

---

## 🚨 **TROUBLESHOOTING**

### **If Customer Insights table already exists:**
- The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run again
- If you get constraint errors, drop and recreate:
  ```sql
  DROP TABLE IF EXISTS "customer_insights" CASCADE;
  -- Then run the migration script again
  ```

### **If Prisma generate fails:**
- Ensure you're in the project root directory
- Check that `prisma/schema.prisma` includes the CustomerInsight model
- Try: `npx prisma generate --schema=./prisma/schema.prisma`

### **If foreign key constraints fail:**
- Ensure Contact and Tenant tables exist
- Check that the table names match exactly (case-sensitive)

---

## 📋 **MIGRATION CHECKLIST**

- [ ] Run `MANUAL_SQL_MIGRATION_CUSTOMER_INSIGHTS.sql` in Supabase SQL Editor
- [ ] Verify CustomerInsights table created
- [ ] Run `npx prisma generate`
- [ ] Verify Prisma client updated
- [ ] Test API endpoints
- [ ] Test UI components

---

## ✅ **EXPECTED RESULTS**

After migration:
- ✅ `customer_insights` table exists
- ✅ All indexes created
- ✅ Foreign keys established
- ✅ Prisma client includes CustomerInsight model
- ✅ API endpoints can access CustomerInsight model

---

**Ready to proceed with migration!**
