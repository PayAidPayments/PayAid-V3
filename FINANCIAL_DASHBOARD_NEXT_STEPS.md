# Financial Dashboard Module - Next Steps Guide

## ✅ Completed Implementation

All code for the Financial Dashboard Module (1.3) has been implemented:
- ✅ Database schema models (10 models)
- ✅ Core services (P&L, Cash Flow, Variance, Alerts)
- ✅ API endpoints (15+ endpoints)
- ✅ Frontend components (Dashboard, Tables, Banners)
- ✅ Performance optimizations (Materialized Views SQL)
- ✅ Automation scripts (Initialization, Cron jobs)
- ✅ Integration services (GL Sync, Transaction Sync, Period Manager)

## 📋 Next Steps to Complete Deployment

### Step 1: Apply Database Schema Changes

**Option A: Using Prisma Migrate (Recommended)**
```bash
# Wait for database pool to be available, then run:
npx prisma migrate dev --name add_financial_dashboard_models

# Or if you want to create migration without applying:
npx prisma migrate dev --name add_financial_dashboard_models --create-only
```

**Option B: Using Prisma DB Push (Faster, for development)**
```bash
npx prisma db push
```

**Option C: Manual SQL (If Prisma fails)**
1. Connect to your PostgreSQL database
2. Run the SQL from `prisma/migrations/` (after migration is created)

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

This will generate TypeScript types for the new models.

### Step 3: Apply Materialized Views

**Important:** These views significantly improve query performance for financial reports.

```bash
# Connect to your database and run:
psql $DATABASE_URL -f prisma/migrations/financial-dashboard-materialized-views.sql

# Or use Prisma Studio to execute the SQL:
npx prisma studio
# Then navigate to "Raw SQL" and paste the contents of:
# prisma/migrations/financial-dashboard-materialized-views.sql
```

**Alternative:** Use the API endpoint to apply views:
```bash
# Create a script or use Postman to call:
POST /api/v1/financials/sync
# This will also sync existing data
```

### Step 4: Initialize Financial Dashboard for Tenants

For each tenant that needs the Financial Dashboard:

```bash
# Set the tenant ID
export TENANT_ID="your-tenant-id"

# Run the initialization script
npx tsx scripts/init-financial-dashboard.ts
```

**What this does:**
- Creates default Chart of Accounts (Bank, AR, Revenue, Expenses)
- Sets up Financial Periods for current and next fiscal year
- Prepares the tenant for financial tracking

### Step 5: Sync Existing Data (If Applicable)

If you have existing invoices, payments, or transactions:

```bash
# Use the sync API endpoint
POST /api/v1/financials/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "syncInvoices": true,
  "syncPayments": true,
  "syncBankFeeds": false
}
```

**Or use the service directly:**
```typescript
import { syncFinancialData } from '@/lib/services/financial/transaction-sync'

await syncFinancialData(tenantId, {
  syncInvoices: true,
  syncPayments: true,
})
```

### Step 6: Set Up Cron Jobs (Optional but Recommended)

The cron job automates:
- Daily materialized view refreshes
- Alert checking
- Cash flow projections
- Period closing checks

**Vercel Cron Configuration:**
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/financial-dashboard",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Or use external cron service:**
- Set up a cron job to call: `GET /api/cron/financial-dashboard`

### Step 7: Verify Implementation

1. **Check API Endpoints:**
   ```bash
   # Test dashboard snapshot
   GET /api/v1/financials/dashboard
   
   # Test P&L
   GET /api/v1/financials/p-and-l?startDate=2024-01-01&endDate=2024-12-31
   
   # Test cash flow
   GET /api/v1/financials/cash-flow/daily?startDate=2024-01-01&endDate=2024-12-31
   ```

2. **Check Frontend:**
   - Navigate to `/financials/dashboard`
   - Verify all KPI cards display correctly
   - Check charts render properly
   - Test export functionality

3. **Check Database:**
   ```bash
   npx prisma studio
   # Verify tables exist:
   # - ChartOfAccounts
   # - FinancialTransaction
   # - GeneralLedger
   # - FinancialPeriod
   # - FinancialBudget
   # - FinancialVariance
   # - FinancialForecast
   # - FinancialAlert
   # - FinancialAlertLog
   # - CashFlowProjection
   ```

### Step 8: Enable Module Access

Ensure tenants have access to the Financial Dashboard module:

```typescript
// Update tenant's licensedModules
await prisma.tenant.update({
  where: { id: tenantId },
  data: {
    licensedModules: {
      push: 'financial-dashboard'
    }
  }
})
```

## 🔧 Troubleshooting

### Database Connection Pool Errors

If you see `MaxClientsInSessionMode` errors:
1. Wait a few minutes for connections to free up
2. Use `prisma db push` instead of `migrate dev`
3. Apply changes during off-peak hours
4. Consider increasing pool size in Supabase settings

### Prisma Generate Errors

If `npx prisma generate` fails:
1. Check file permissions
2. Ensure `node_modules` is writable
3. Try deleting `.prisma` folder and regenerating
4. Check disk space

### Materialized View Errors

If materialized views fail to create:
1. Ensure you have CREATE privileges
2. Check if views already exist (they use `IF NOT EXISTS`)
3. Run views one at a time to identify issues
4. Check PostgreSQL version (requires 9.3+)

## 📊 Performance Optimization

After deployment, monitor:
- Query performance on dashboard load
- Materialized view refresh times
- API response times
- Database connection usage

**Refresh materialized views manually:**
```sql
SELECT refresh_all_financial_views();
```

**Or via API:**
```bash
POST /api/v1/financials/sync?refreshViews=true
```

## ✅ Completion Checklist

- [ ] Database schema applied
- [ ] Prisma client generated
- [ ] Materialized views created
- [ ] Initialization script run for tenants
- [ ] Existing data synced (if applicable)
- [ ] Cron jobs configured
- [ ] API endpoints tested
- [ ] Frontend verified
- [ ] Module access enabled
- [ ] Performance monitoring set up

## 📝 Notes

- All financial amounts are in **INR only** (as per requirements)
- Payment gateway integration uses **PayAid Payments only**
- All dates use **Indian Standard Time (IST)**
- Financial periods follow **Indian fiscal year** (April to March)
- All exports support **PDF, Excel, and CSV** formats

---

**Status:** Code implementation 100% complete. Ready for deployment steps above.
