# Manual Deployment Instructions - Financial Dashboard

**Date:** January 2026  
**Status:** Step 1 Complete ✅ - Ready for Steps 3-5

---

## ✅ **COMPLETED**

- **Step 1:** Database schema applied successfully
- All 10 financial dashboard tables created

---

## 🎯 **NEXT: Run Deployment Script**

### **Option 1: Run Full Script (Recommended)**

Open PowerShell or Terminal in the project directory and run:

```powershell
cd "D:\Cursor Projects\PayAid V3"
npx tsx scripts/deploy-financial-dashboard.ts --skip-schema
```

**What this does:**
- Creates materialized views (Step 3)
- Initializes tenants (Step 4)
- Syncs existing data (Step 5)
- Enables module access (Step 9)

**Expected time:** 5-15 minutes

---

### **Option 2: Run Steps Individually**

If the full script has issues, you can run steps separately:

#### **Step 3: Materialized Views**

```powershell
cd "D:\Cursor Projects\PayAid V3"
npx tsx scripts/apply-materialized-views.ts
```

**Or manually via SQL:**
1. Connect to your database
2. Run SQL from: `prisma/migrations/financial-dashboard-materialized-views.sql`

#### **Step 4: Tenant Initialization**

```powershell
cd "D:\Cursor Projects\PayAid V3"
# For each tenant:
$env:TENANT_ID="your-tenant-id"
npx tsx scripts/init-financial-dashboard.ts
```

#### **Step 5: Data Synchronization**

```powershell
cd "D:\Cursor Projects\PayAid V3"
npx tsx scripts/sync-all-tenants-financial.ts
```

**Or via API:**
```powershell
Invoke-RestMethod -Uri "https://your-app.vercel.app/api/v1/financials/sync" -Method POST
```

---

## 📋 **Verification Checklist**

After running the script, verify:

### **Step 3: Materialized Views**
- [ ] `mv_account_balances` exists
- [ ] `mv_pl_summary` exists
- [ ] `mv_cash_flow_daily` exists
- [ ] Refresh functions created

### **Step 4: Tenant Initialization**
- [ ] Default chart of accounts created (9 accounts per tenant)
- [ ] Financial periods created (24 periods per tenant)
- [ ] Module access enabled (`financial-dashboard` in `licensedModules`)

### **Step 5: Data Sync**
- [ ] Existing invoices synced to financial transactions
- [ ] Existing payments synced to financial transactions
- [ ] General Ledger entries created

---

## 🐛 **Troubleshooting**

### **If Script Fails:**

1. **Check Database Connection:**
   ```powershell
   # Verify DATABASE_URL in .env
   Get-Content .env | Select-String "DATABASE_URL"
   ```

2. **Check Prisma Connection:**
   ```powershell
   npx prisma db pull
   ```

3. **Run with Verbose Output:**
   ```powershell
   $env:DEBUG="*"
   npx tsx scripts/deploy-financial-dashboard.ts --skip-schema
   ```

### **Common Issues:**

- **"Cannot find module"** → Make sure you're in the project root directory
- **"Database connection failed"** → Check DATABASE_URL in .env
- **"Table already exists"** → This is OK, script will skip existing objects
- **Script times out** → Run steps individually instead

---

## 📊 **Progress After Running**

Once Steps 3-5 complete:
1. ✅ Update TODO list to mark Steps 3-5 as complete
2. ⏳ Test API endpoints (Step 7)
3. ⏳ Verify frontend (Step 8)

---

**Status:** Ready to execute Steps 3-5  
**Estimated Time:** 5-15 minutes
