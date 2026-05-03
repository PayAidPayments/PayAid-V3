# Production Migration Plan - PayAid V3

**Date:** January 15, 2026  
**Status:** Critical - Do NOT delete existing production code  
**Risk Level:** HIGH - Requires careful planning

---

## ⚠️ CRITICAL WARNING

**DO NOT DELETE existing production code on Vercel or GitHub without:**
1. ✅ Complete database backup
2. ✅ Full code backup
3. ✅ Migration testing in staging
4. ✅ Rollback plan ready
5. ✅ Data migration strategy

---

## 🎯 Recommended Strategy: Gradual Migration

### Option 1: Blue-Green Deployment (RECOMMENDED)

**Concept:** Run old and new versions side-by-side, switch traffic gradually.

**Steps:**
1. Keep existing production running
2. Deploy new version to new Vercel project (staging)
3. Test thoroughly in staging
4. Switch DNS/traffic gradually
5. Keep old version as backup for 7-14 days

**Advantages:**
- Zero downtime
- Easy rollback
- Can test in production-like environment
- No data loss risk

---

### Option 2: Branch-Based Deployment

**Concept:** Use Git branches to manage old vs new code.

**Steps:**
1. Create `production-legacy` branch (backup of current production)
2. Create `production-v3` branch (new code)
3. Deploy `production-v3` to new Vercel project
4. Test and validate
5. Switch production DNS to new project
6. Keep `production-legacy` branch for 30 days

**Advantages:**
- Code history preserved
- Easy to compare versions
- Can revert quickly

---

### Option 3: Feature Flags (If Same Codebase)

**Concept:** If new code is in same repo, use feature flags.

**Steps:**
1. Merge new code to main branch
2. Use feature flags to enable new features gradually
3. Monitor and rollback if issues
4. Remove old code after validation

**Note:** Only if both versions are in same repository.

---

## 📋 Pre-Migration Checklist

### 1. Backup Everything

```bash
# Backup Database
# If using Supabase:
# - Go to Dashboard > Database > Backups
# - Create manual backup
# - Download backup file

# If using self-hosted PostgreSQL:
./scripts/backup-database.sh

# Backup Code
# Create archive of current production code
git archive --format=tar.gz --output=production-backup-$(date +%Y%m%d).tar.gz production-branch

# Backup Environment Variables
# Export all Vercel environment variables
# Save to secure location
```

### 2. Document Current State

- [ ] List all active users
- [ ] Document current features in use
- [ ] Note any custom configurations
- [ ] List all integrations (payment gateways, email, SMS)
- [ ] Document database schema differences
- [ ] List all API endpoints currently in use

### 3. Database Migration Plan

**Critical Questions:**
- [ ] Is database schema compatible?
- [ ] Do we need data migration scripts?
- [ ] Are there breaking changes?
- [ ] Can we run both versions on same database?

**If Schema Changes:**
```bash
# Create migration script
npx prisma migrate dev --name production_migration

# Test migration on copy of production database
# Verify data integrity
# Document rollback procedure
```

---

## 🚀 Step-by-Step Migration Plan

### Phase 1: Preparation (Week 1)

**Day 1-2: Backup & Documentation**
- [ ] Backup production database
- [ ] Backup production code (Git archive)
- [ ] Export all environment variables
- [ ] Document current production state
- [ ] Create rollback procedure document

**Day 3-4: Staging Setup**
- [ ] Create new Vercel project: `payaid-v3-staging`
- [ ] Deploy new code to staging
- [ ] Configure staging environment variables
- [ ] Set up staging database (copy of production)
- [ ] Test all critical features

**Day 5: Testing**
- [ ] Run full test suite
- [ ] Test data migration scripts
- [ ] Performance testing
- [ ] Security audit
- [ ] User acceptance testing (if possible)

### Phase 2: Parallel Deployment (Week 2)

**Day 1-3: Deploy New Version**
- [ ] Create new Vercel project: `payaid-v3-production`
- [ ] Deploy new code
- [ ] Configure production environment
- [ ] Point to production database (or create new)
- [ ] Run database migrations (if needed)

**Day 4-5: Validation**
- [ ] Smoke tests on new production
- [ ] Compare data between old and new
- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Performance benchmarking

### Phase 3: Traffic Migration (Week 3)

**Option A: DNS Switch (Recommended)**
```bash
# Old: payaid.com → old-vercel-project.vercel.app
# New: payaid-v3.com → new-vercel-project.vercel.app

# Step 1: Point new domain to new project
# Step 2: Test new domain thoroughly
# Step 3: Switch main domain DNS
# Step 4: Monitor for 24-48 hours
# Step 5: Keep old domain as backup
```

**Option B: Gradual Traffic Split**
- Use Vercel Edge Config or Cloudflare Workers
- Route 10% traffic to new version
- Monitor for issues
- Gradually increase to 50%, then 100%

### Phase 4: Cleanup (Week 4+)

**After 7-14 days of stable operation:**
- [ ] Archive old Vercel project (don't delete yet)
- [ ] Archive old GitHub branch
- [ ] Update documentation
- [ ] Remove old environment variables
- [ ] Keep backups for 30 days minimum

---

## 🔄 Rollback Procedure

### If Issues Detected:

**Immediate Rollback (< 5 minutes):**
```bash
# Option 1: DNS Switch
# Point DNS back to old Vercel project

# Option 2: Vercel Rollback
# In Vercel dashboard, redeploy previous deployment

# Option 3: Git Rollback
git checkout production-legacy
git push origin production-legacy --force
# Redeploy on Vercel
```

**Database Rollback:**
```bash
# If database was migrated
./scripts/restore-database.sh backup-before-migration.sql.gz

# Verify data integrity
# Test critical queries
```

---

## 📊 Migration Comparison

| Aspect | Old (Monolithic) | New (V3) | Migration Impact |
|--------|------------------|----------|------------------|
| **Architecture** | Monolithic | Modular | ⚠️ High - May need data migration |
| **Database Schema** | ? | Prisma-based | ⚠️ Check compatibility |
| **API Endpoints** | ? | 577+ endpoints | ⚠️ Verify backward compatibility |
| **Authentication** | ? | JWT + NextAuth | ⚠️ May need user re-authentication |
| **File Storage** | ? | Cloudflare R2 / MinIO | ⚠️ May need file migration |
| **Environment Variables** | ? | New structure | ⚠️ Need to reconfigure |

---

## 🛡️ Safety Measures

### 1. Keep Old Code Accessible

```bash
# Create backup branch
git checkout -b production-legacy-backup
git push origin production-legacy-backup

# Tag current production
git tag production-v2-final
git push origin production-v2-final
```

### 2. Database Safety

```bash
# Create database backup before migration
./scripts/backup-database.sh

# Test migration on copy first
# Never migrate production database directly
```

### 3. Environment Variables

- Export all from old Vercel project
- Document each variable's purpose
- Map to new variable names if changed
- Test in staging first

### 4. Monitoring

- Set up error tracking (Sentry, etc.)
- Monitor database performance
- Track API response times
- Watch for increased error rates
- Monitor user sessions

---

## 📝 Migration Script Template

### Database Migration Check

```typescript
// scripts/check-migration-compatibility.ts
import { PrismaClient } from '@prisma/client'

async function checkCompatibility() {
  const prisma = new PrismaClient()
  
  try {
    // Check if old schema tables exist
    const oldTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    
    // Check if new schema is compatible
    // Run Prisma migrations in dry-run mode
    // Compare schemas
    
    console.log('Migration compatibility check complete')
  } finally {
    await prisma.$disconnect()
  }
}
```

---

## 🎯 Recommended Approach for Your Situation

### Since You Have Completely Changed Platform:

**1. Create New Vercel Project (DO NOT DELETE OLD)**
```bash
# New project name: payaid-v3-production
# Old project: Keep as payaid-legacy (or current name)
```

**2. Use New Database or Migrate Carefully**
```bash
# Option A: New database (safest)
# - Create new Supabase project
# - Run migrations
# - Import critical data only

# Option B: Same database (risky)
# - Backup first
# - Test migrations on copy
# - Run migrations carefully
```

**3. Gradual User Migration**
- Announce migration to users
- Provide migration window
- Support both versions temporarily
- Migrate users in batches

**4. Keep Old Code for 30 Days**
- Don't delete GitHub branches
- Don't delete Vercel projects
- Keep backups accessible
- Document everything

---

## ✅ Final Checklist Before Migration

### Pre-Migration
- [ ] Complete database backup
- [ ] Code backup (Git archive)
- [ ] Environment variables exported
- [ ] Staging deployment successful
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Security audit complete
- [ ] Rollback plan documented
- [ ] Team notified

### During Migration
- [ ] Monitor error rates
- [ ] Watch database performance
- [ ] Check user sessions
- [ ] Verify critical features
- [ ] Test payment processing
- [ ] Validate data integrity

### Post-Migration
- [ ] Monitor for 48 hours
- [ ] User feedback collection
- [ ] Performance metrics review
- [ ] Error log analysis
- [ ] Database health check
- [ ] Archive old code (don't delete)
- [ ] Update documentation

---

## 🚨 Emergency Contacts & Procedures

**If Critical Issues:**
1. **Immediate:** Rollback DNS or Vercel deployment
2. **Within 1 hour:** Restore database backup if needed
3. **Within 24 hours:** Root cause analysis
4. **Document:** All issues and resolutions

---

## 📞 Next Steps

1. **This Week:**
   - [ ] Review this migration plan with team
   - [ ] Create backups of everything
   - [ ] Set up staging environment
   - [ ] Test new code thoroughly

2. **Next Week:**
   - [ ] Deploy to staging
   - [ ] Run migration tests
   - [ ] Prepare production deployment

3. **Week 3:**
   - [ ] Execute production migration
   - [ ] Monitor closely
   - [ ] Be ready to rollback

---

**Remember:** It's better to take 2-3 weeks for safe migration than to rush and lose data or have extended downtime.

---

**Last Updated:** January 15, 2026  
**Status:** Ready for Review
