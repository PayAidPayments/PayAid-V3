# Phase 1 Database Migration Guide

**Date:** December 2025  
**Purpose:** Step-by-step guide to migrate database for Phase 1 licensing system

---

## ⚠️ Pre-Migration Checklist

- [ ] **Backup Database** - Create full database backup
- [ ] **Review Schema Changes** - Understand what's being added
- [ ] **Test on Staging** - Run migration on staging first
- [ ] **Notify Team** - Inform team of maintenance window (if needed)

---

## 📋 Schema Changes Summary

### New Fields Added:
- `Tenant.licensedModules` - String array (default: `[]`)
- `Tenant.subscriptionTier` - String (default: `'free'`)

### New Models Created:
- `Subscription` - Subscription tracking
- `ModuleDefinition` - Module catalog
- `CRMConfig` - CRM-specific settings
- `InvoicingConfig` - Invoicing-specific settings

### New Indexes:
- `Tenant.subscriptionTier` - For filtering by tier
- `ModuleDefinition.moduleId` - For module lookups
- `ModuleDefinition.isActive` - For active module filtering

---

## 🚀 Migration Steps

### Step 1: Generate Prisma Client

```bash
npx prisma generate
```

**Expected Output:**
- Prisma client regenerated with new models
- TypeScript types updated

---

### Step 2: Create Migration (Development)

```bash
npx prisma migrate dev --name add_licensing_layer
```

**What This Does:**
- Creates migration file in `prisma/migrations/`
- Applies changes to your database
- Updates `_prisma_migrations` table

**Expected Output:**
```
✔ Generated Prisma Client
✔ Created migration: add_licensing_layer
✔ Applied migration: add_licensing_layer
```

---

### Step 3: Push to Database (Alternative - Direct Push)

**⚠️ Use only if you don't need migration history:**

```bash
npx prisma db push
```

**When to Use:**
- Development environment
- Quick prototyping
- When migration history isn't critical

**When NOT to Use:**
- Production environment
- When you need rollback capability
- When tracking migration history is important

---

### Step 4: Verify Migration

#### Check Database Schema:

```sql
-- Check Tenant table has new fields
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Tenant'
AND column_name IN ('licensedModules', 'subscriptionTier');

-- Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('Subscription', 'ModuleDefinition', 'CRMConfig', 'InvoicingConfig');
```

#### Check Prisma Client:

```typescript
// In a test file or console
import { prisma } from '@/lib/db/prisma'

// Should work without errors
const tenant = await prisma.tenant.findFirst({
  select: {
    licensedModules: true,
    subscriptionTier: true,
  },
})

console.log('Migration verified:', tenant)
```

---

### Step 5: Seed Module Definitions

Run the seed script to populate module catalog:

```bash
npx prisma db seed
```

Or manually run:

```typescript
// scripts/seed-modules.ts
import { prisma } from '@/lib/db/prisma'

const modules = [
  {
    moduleId: 'crm',
    name: 'CRM',
    description: 'Customer relationship management',
    category: 'sales',
    isActive: true,
    pricing: {
      starter: 1999,
      professional: 2999,
    },
  },
  {
    moduleId: 'invoicing',
    name: 'Invoicing',
    description: 'Invoice creation and management',
    category: 'finance',
    isActive: true,
    pricing: {
      starter: 1999,
      professional: 2999,
    },
  },
  {
    moduleId: 'accounting',
    name: 'Accounting',
    description: 'Complete accounting system',
    category: 'finance',
    isActive: true,
    pricing: {
      starter: 2499,
      professional: 3999,
    },
  },
  {
    moduleId: 'hr',
    name: 'HR & Payroll',
    description: 'Human resources and payroll',
    category: 'hr',
    isActive: true,
    pricing: {
      starter: 2499,
      professional: 3999,
    },
  },
  {
    moduleId: 'whatsapp',
    name: 'WhatsApp',
    description: 'WhatsApp Business integration',
    category: 'communication',
    isActive: true,
    pricing: {
      starter: 1999,
      professional: 2999,
    },
  },
  {
    moduleId: 'analytics',
    name: 'Analytics',
    description: 'Business intelligence and reporting',
    category: 'analytics',
    isActive: true,
    pricing: {
      starter: 1999,
      professional: 2999,
    },
  },
]

async function seedModules() {
  for (const module of modules) {
    await prisma.moduleDefinition.upsert({
      where: { moduleId: module.moduleId },
      update: module,
      create: module,
    })
  }
  console.log('✅ Module definitions seeded')
}

seedModules()
```

---

## 🔄 Data Migration

### Existing Tenants

**Default Behavior:**
- All existing tenants will have `licensedModules = []` (empty array)
- All existing tenants will have `subscriptionTier = 'free'`

**To Grant Initial Licenses:**

```typescript
// scripts/grant-initial-licenses.ts
import { prisma } from '@/lib/db/prisma'

// Grant all modules to specific tenant (for testing)
await prisma.tenant.update({
  where: { id: 'your-tenant-id' },
  data: {
    licensedModules: ['crm', 'invoicing', 'accounting', 'hr', 'whatsapp', 'analytics'],
    subscriptionTier: 'professional',
  },
})
```

---

## ✅ Post-Migration Verification

### 1. Test API Routes

```bash
# Test with unlicensed tenant (should return 403)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/contacts

# Test with licensed tenant (should return 200)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/contacts
```

### 2. Test Frontend

1. Login with test user
2. Check Sidebar - should show only licensed modules
3. Try accessing unlicensed module - should show upgrade prompt
4. Test admin panel - should be able to toggle licenses

### 3. Check Logs

```bash
# Check for any Prisma errors
grep -i "prisma\|error" logs/app.log

# Check for migration errors
grep -i "migration" logs/app.log
```

---

## 🚨 Rollback Procedure

### If Migration Fails:

1. **Restore Database Backup:**
   ```bash
   # PostgreSQL restore
   pg_restore -d payaid_db backup.dump
   ```

2. **Revert Prisma Schema:**
   ```bash
   git checkout HEAD~1 prisma/schema.prisma
   npx prisma generate
   ```

3. **Revert Code Changes:**
   ```bash
   git checkout HEAD~1
   ```

---

## 📊 Migration Impact

### Zero Downtime:
- ✅ New fields have defaults
- ✅ Existing queries continue to work
- ✅ No breaking changes

### Performance:
- ✅ New indexes improve query performance
- ✅ No negative impact on existing queries

### Data Integrity:
- ✅ All existing data preserved
- ✅ No data loss
- ✅ Backward compatible

---

## 🎯 Production Deployment

### Pre-Production:

1. **Run on Staging:**
   ```bash
   # On staging server
   npx prisma migrate deploy
   ```

2. **Verify Staging:**
   - Test all flows
   - Check logs
   - Monitor performance

3. **Create Production Backup:**
   ```bash
   pg_dump -F c -f backup_$(date +%Y%m%d).dump payaid_prod
   ```

### Production:

1. **Schedule Maintenance Window** (if needed)
2. **Run Migration:**
   ```bash
   npx prisma migrate deploy
   ```
3. **Verify:**
   - Check application logs
   - Test critical flows
   - Monitor error rates

---

## 📝 Migration Checklist

- [ ] Backup created
- [ ] Migration tested on staging
- [ ] Module definitions seeded
- [ ] API routes tested
- [ ] Frontend tested
- [ ] Logs reviewed
- [ ] Team notified
- [ ] Production backup created
- [ ] Migration executed
- [ ] Post-migration verification complete

---

## 🆘 Troubleshooting

### Issue: Migration fails with "column already exists"

**Solution:**
```bash
# Check if migration was partially applied
npx prisma migrate status

# If needed, manually fix schema
npx prisma db push --skip-generate
```

### Issue: Prisma client not updated

**Solution:**
```bash
# Regenerate client
npx prisma generate

# Restart dev server
npm run dev
```

### Issue: TypeScript errors after migration

**Solution:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules/.cache
npm run build
```

---

## ✅ Success Criteria

Migration is successful when:

- ✅ All new tables created
- ✅ All new fields added to Tenant
- ✅ Prisma client generated successfully
- ✅ Module definitions seeded
- ✅ API routes work with license checking
- ✅ Frontend shows correct module access
- ✅ No errors in logs
- ✅ All tests pass

---

**Migration Status:** Ready to Execute  
**Estimated Time:** 5-10 minutes  
**Risk Level:** Low (backward compatible)
