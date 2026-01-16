# Landing Page Preservation Plan - Replace Everything Else

**Date:** January 15, 2026  
**Strategy:** Keep landing page, replace all application code  
**Risk Level:** MEDIUM - Requires careful file management

---

## 🎯 Strategy Overview

**What to Keep:**
- ✅ `app/page.tsx` - Main landing page (public homepage)
- ✅ `app/login/page.tsx` - Login page (if exists)
- ✅ `app/signup/page.tsx` - Signup page (if exists)
- ✅ Any public marketing pages

**What to Replace:**
- ❌ All dashboard pages (`app/dashboard/**`)
- ❌ All API routes (`app/api/**`) - except public ones
- ❌ All authenticated routes
- ❌ All module-specific code
- ❌ Database schema (if needed)
- ❌ Configuration files (update carefully)

---

## 📋 Pre-Deployment Checklist

### Step 1: Backup Landing Page

```bash
# Create backup of landing page
mkdir -p .backup/landing-page
cp app/page.tsx .backup/landing-page/page.tsx

# Backup login/signup if they exist
[ -f app/login/page.tsx ] && cp app/login/page.tsx .backup/landing-page/login-page.tsx
[ -f app/signup/page.tsx ] && cp app/signup/page.tsx .backup/landing-page/signup-page.tsx

# Verify backup
ls -la .backup/landing-page/
```

### Step 2: Backup Current Production

```bash
# Run full production backup
./scripts/backup-production.sh

# Export environment variables from Vercel
# Save to secure location
```

### Step 3: Document Landing Page Dependencies

Check what the landing page uses:
- Components it imports
- API endpoints it calls (if any)
- Assets it references
- Environment variables it needs

---

## 🚀 Deployment Steps

### Option A: Direct Replace (Recommended for Vercel)

**Step 1: Backup Landing Page Locally**
```bash
# Backup current landing page
cp app/page.tsx app/page.tsx.backup
```

**Step 2: Push New Code to GitHub**
```bash
# Commit all new code
git add .
git commit -m "feat: PayAid V3 complete platform update (keeping landing page)"

# Push to main branch
git push origin main
```

**Step 3: Vercel Will Auto-Deploy**
- Vercel detects changes
- Builds new version
- Deploys automatically
- Landing page (`app/page.tsx`) is preserved

**Step 4: Verify Landing Page**
```bash
# After deployment, check landing page
curl https://your-domain.com/
# Should show your landing page

# Check application
curl https://your-domain.com/dashboard
# Should show new application
```

### Option B: Manual File Management

If you want more control:

**Step 1: Create Landing Page Backup Branch**
```bash
# Create branch with just landing page
git checkout -b landing-page-backup
git add app/page.tsx
git commit -m "backup: Landing page before V3 migration"
git push origin landing-page-backup
```

**Step 2: Merge New Code**
```bash
# Switch to main
git checkout main

# Merge or replace code
# Landing page should remain unchanged
```

**Step 3: Verify Landing Page Intact**
```bash
# Check landing page file
cat app/page.tsx | head -20
# Should match your original landing page
```

---

## 🔍 Verification Steps

### After Deployment:

1. **Check Landing Page:**
   ```bash
   # Visit homepage
   curl https://your-domain.com/
   
   # Should return landing page HTML
   # Check for:
   # - Logo/branding
   # - Hero section
   # - Sign In / Get Started buttons
   # - All sections visible
   ```

2. **Check Application:**
   ```bash
   # Test login
   curl https://your-domain.com/login
   
   # Test dashboard (after login)
   # Should show new V3 dashboard
   ```

3. **Check API:**
   ```bash
   # Test health endpoint
   curl https://your-domain.com/api/health
   
   # Should return 200 OK
   ```

---

## ⚠️ Important Considerations

### Landing Page Dependencies

**Check if landing page uses:**
- [ ] Specific components (may need to preserve)
- [ ] API endpoints (may need to keep compatible)
- [ ] Environment variables (need to set in Vercel)
- [ ] Static assets (images, fonts, etc.)
- [ ] Third-party scripts (analytics, etc.)

### Components to Preserve

If landing page imports components, preserve:
- `components/brand/Logo.tsx` (if used)
- `components/ui/*` (if used in landing page)
- Any landing-page-specific components

### API Endpoints to Check

If landing page makes API calls:
- [ ] Contact form submission
- [ ] Newsletter signup
- [ ] Demo request
- [ ] Any public endpoints

---

## 📝 Step-by-Step Execution Plan

### Week 1: Preparation

**Day 1: Backup & Analysis**
- [ ] Backup landing page: `cp app/page.tsx .backup/landing-page/`
- [ ] Document landing page dependencies
- [ ] List all components used by landing page
- [ ] Check for API calls in landing page
- [ ] Backup current production code

**Day 2: Test Locally**
- [ ] Verify new code builds successfully
- [ ] Test landing page still works
- [ ] Test application functionality
- [ ] Fix any breaking changes

**Day 3: Staging Deployment**
- [ ] Deploy to Vercel staging
- [ ] Verify landing page on staging
- [ ] Test full application on staging
- [ ] Get team approval

### Week 2: Production Deployment

**Day 1: Final Checks**
- [ ] Review landing page one more time
- [ ] Verify all environment variables set
- [ ] Check database migrations ready
- [ ] Prepare rollback plan

**Day 2: Deploy to Production**
- [ ] Push code to GitHub main branch
- [ ] Vercel auto-deploys
- [ ] Monitor deployment logs
- [ ] Verify landing page immediately

**Day 3-5: Monitoring**
- [ ] Check landing page hourly (first 24 hours)
- [ ] Monitor application errors
- [ ] Check user feedback
- [ ] Verify all features working

---

## 🔄 Rollback Plan

### If Landing Page Breaks:

**Immediate (< 5 minutes):**
```bash
# Restore landing page from backup
cp .backup/landing-page/page.tsx app/page.tsx

# Commit and push
git add app/page.tsx
git commit -m "fix: Restore landing page"
git push origin main

# Vercel will auto-redeploy
```

### If Application Breaks:

**Option 1: Quick Fix**
- Fix issue in code
- Push fix
- Vercel redeploys

**Option 2: Rollback Deployment**
- In Vercel dashboard, redeploy previous working version
- Fix issues
- Redeploy when ready

---

## ✅ Final Checklist

### Before Deployment:
- [ ] Landing page backed up: `.backup/landing-page/page.tsx`
- [ ] Landing page dependencies documented
- [ ] New code tested locally
- [ ] Staging deployment successful
- [ ] Landing page verified on staging
- [ ] Environment variables ready
- [ ] Database migrations tested
- [ ] Rollback plan ready

### After Deployment:
- [ ] Landing page loads correctly
- [ ] Landing page styling intact
- [ ] Sign In / Get Started buttons work
- [ ] Application login works
- [ ] Dashboard loads
- [ ] No console errors
- [ ] All features functional

---

## 🎯 Quick Deployment Command

```bash
# 1. Backup landing page
mkdir -p .backup/landing-page
cp app/page.tsx .backup/landing-page/page.tsx

# 2. Verify landing page is correct
cat app/page.tsx | head -30

# 3. Commit and push (landing page stays in place)
git add .
git commit -m "feat: Deploy PayAid V3 (landing page preserved)"
git push origin main

# 4. Vercel auto-deploys
# 5. Verify landing page after deployment
curl https://your-domain.com/ | grep -i "landing\|hero\|get started"
```

---

## 📊 What Gets Replaced

| Category | Status | Action |
|----------|--------|--------|
| **Landing Page** (`app/page.tsx`) | ✅ Keep | No changes |
| **Login/Signup Pages** | ⚠️ Check | Keep if they exist |
| **Dashboard** (`app/dashboard/**`) | ❌ Replace | All new code |
| **API Routes** (`app/api/**`) | ❌ Replace | All new endpoints |
| **Modules** (CRM, Finance, etc.) | ❌ Replace | All new modules |
| **Database Schema** | ⚠️ Migrate | Run Prisma migrations |
| **Components** | ⚠️ Selective | Keep landing page components |
| **Configuration** | ⚠️ Update | Merge carefully |

---

## 💡 Key Points

1. **Landing page stays in `app/page.tsx`** - Don't delete or modify it
2. **Vercel auto-deploys** - Just push to main branch
3. **Verify immediately** - Check landing page right after deployment
4. **Have backup ready** - Can restore in < 5 minutes if needed
5. **Test staging first** - Always test before production

---

**Last Updated:** January 15, 2026  
**Status:** Ready for Execution
