# Database Migration Setup Guide

## 🔍 Problem Identified

Several database tables are missing in production, causing errors:
- ❌ `chart_of_accounts` - Missing (causes finance API 500 errors)
- ❌ `financial_transactions` - Missing (causes finance API errors)
- ❌ `general_ledger` - Likely missing
- ❌ `financial_periods` - Likely missing
- ❌ `financial_budgets` - Likely missing
- ❌ `financial_variance` - Likely missing
- ❌ `financial_forecasts` - Likely missing

## ✅ Solutions Implemented

### 1. API Error Handling
- Finance APIs now handle missing tables gracefully
- Return default/empty data instead of crashing
- Log warnings when tables don't exist

### 2. Migration Scripts Created
- `scripts/check-missing-tables.ts` - Check which tables are missing
- `scripts/run-migrations-vercel.ts` - Run migrations for Vercel production

### 3. Seed Function Enhanced
- Seed function now initializes chart of accounts
- Handles missing table gracefully

## 🚀 How to Run Migrations

### Option 1: Check Missing Tables First (Recommended)

```bash
# Check which tables are missing
npm run db:check-tables
```

This will show you:
- ✅ Tables that exist
- ❌ Tables that are missing
- ⚠️  Tables with errors

### Option 2: Run Migrations on Vercel

#### Via Vercel CLI (Recommended)

```bash
# 1. Pull production environment variables
vercel env pull .env.production

# 2. Run migration script
npm run db:migrate:vercel
```

#### Via Vercel Dashboard

1. Go to Vercel Dashboard → Your Project → Settings → Build & Development Settings
2. Update **Build Command** to:
   ```bash
   npm run build
   ```
3. Add a **Postinstall Command** (optional):
   ```bash
   npm run db:migrate:vercel
   ```

**Note:** Postinstall runs on every deployment. Only use if you want automatic migrations.

### Option 3: Manual Migration (Direct Database Access)

If you have direct database access:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

**⚠️ Warning:** `db:push` will:
- Create missing tables
- Modify existing tables to match schema
- **May cause data loss** if schema changes conflict with existing data

### Option 4: Create Proper Migration (Best Practice)

For production, create a proper migration:

```bash
# 1. Create migration from schema
npx prisma migrate dev --name add_financial_tables --create-only

# 2. Review the migration file in prisma/migrations/

# 3. Apply migration
npx prisma migrate deploy
```

## 📋 Tables That Need to Be Created

Based on the Prisma schema, these financial tables should exist:

1. **chart_of_accounts** - Master chart of accounts
2. **financial_transactions** - All financial transactions
3. **general_ledger** - Denormalized ledger entries
4. **financial_periods** - Fiscal year/month periods
5. **financial_budgets** - Budget data
6. **financial_variance** - Budget vs actual variance
7. **financial_forecasts** - Predictive forecasts

## 🔧 Quick Fix for Production

### Step 1: Check Current Status

```bash
npm run db:check-tables
```

### Step 2: Run Migration

```bash
# Via Vercel CLI
vercel env pull .env.production
npm run db:migrate:vercel

# Or manually
npm run db:push
```

### Step 3: Verify Tables Created

```bash
npm run db:check-tables
```

### Step 4: Seed Data

After tables are created, seed the data:

```bash
# Via API (from browser console)
fetch('/api/admin/seed-now?tenantId=YOUR_TENANT_ID', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

## 🎯 Recommended Approach for Vercel

### One-Time Setup (Now)

1. **Pull production environment:**
   ```bash
   vercel env pull .env.production
   ```

2. **Run migration script:**
   ```bash
   npm run db:migrate:vercel
   ```

3. **Verify tables created:**
   ```bash
   npm run db:check-tables
   ```

4. **Seed data:**
   - Use `/api/admin/seed-now` endpoint
   - Or wait for automatic seeding on dashboard load

### Ongoing (Future Schema Changes)

1. **Create migration:**
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```

2. **Commit migration files:**
   ```bash
   git add prisma/migrations/
   git commit -m "Add migration: descriptive_name"
   git push
   ```

3. **Deploy to Vercel:**
   - Vercel will auto-deploy
   - Run `npm run db:migrate:vercel` manually if needed
   - Or add to build command (not recommended - slows builds)

## 📝 Notes

- **`db:push`** is faster but doesn't create migration history
- **`migrate dev`** creates migration files and history (better for production)
- **`migrate deploy`** applies migrations in production (requires migration files)

## 🚨 Important

- Always backup database before running migrations
- Test migrations on staging first
- Monitor Vercel logs after migration
- Check for errors in production after migration

## 🔗 Related Files

- `prisma/schema.prisma` - Database schema definition
- `scripts/check-missing-tables.ts` - Table checker script
- `scripts/run-migrations-vercel.ts` - Migration runner script
- `app/api/finance/cash-flow/route.ts` - Finance API (handles missing tables)
