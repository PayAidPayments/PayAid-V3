# Quick Deployment Guide - Replace Code, Keep Landing Page

**Strategy:** Direct replacement on existing Vercel project  
**Time:** 30-60 minutes  
**Risk:** Low (landing page preserved)

---

## 🚀 Quick Deployment Steps

### Step 1: Backup Landing Page (5 minutes)

```bash
# Run preservation script
chmod +x scripts/preserve-landing-page.sh
./scripts/preserve-landing-page.sh

# Verify backup created
ls -la .backup/landing-page-*/
```

### Step 2: Verify Landing Page Intact (2 minutes)

```bash
# Check landing page file exists and looks correct
cat app/page.tsx | head -50

# Should see your landing page code
# If not, restore from backup before proceeding
```

### Step 3: Push to GitHub (5 minutes)

```bash
# Add all new files
git add .

# Commit (landing page stays unchanged)
git commit -m "feat: Deploy PayAid V3 complete platform (landing page preserved)"

# Push to main branch
git push origin main
```

### Step 4: Vercel Auto-Deploys (10-15 minutes)

- Vercel detects push to main
- Automatically builds and deploys
- Landing page (`app/page.tsx`) is preserved
- All new code replaces old code

### Step 5: Verify Deployment (5 minutes)

```bash
# Check landing page
curl https://your-domain.com/ | head -50

# Should show your landing page HTML

# Check application (after login)
# Visit: https://your-domain.com/dashboard
# Should show new V3 dashboard
```

---

## ✅ Verification Checklist

### Immediate Checks (< 5 minutes after deployment):

- [ ] Landing page loads: `https://your-domain.com/`
- [ ] Landing page looks correct (no broken layout)
- [ ] "Sign In" button visible and works
- [ ] "Get Started" button visible and works
- [ ] No console errors on landing page

### Application Checks (10 minutes):

- [ ] Can log in: `https://your-domain.com/login`
- [ ] Dashboard loads: `https://your-domain.com/dashboard`
- [ ] No 404 errors
- [ ] API endpoints respond: `https://your-domain.com/api/health`

---

## 🔄 If Landing Page Breaks

### Quick Restore (< 5 minutes):

```bash
# Find latest backup
LATEST_BACKUP=$(ls -td .backup/landing-page-* | head -1)

# Restore landing page
cd "${LATEST_BACKUP}"
./restore.sh

# Commit and push
git add app/page.tsx
git commit -m "fix: Restore landing page"
git push origin main

# Vercel redeploys automatically
```

---

## ⚠️ Important Notes

### What Happens:

1. **Landing Page (`app/page.tsx`):** ✅ Stays exactly as-is
2. **All Other Code:** ❌ Replaced with V3 code
3. **Database:** ⚠️ May need migrations (backup first!)
4. **Environment Variables:** ⚠️ Need to update in Vercel

### Database Considerations:

**If using same database:**
- [ ] Backup database first: `./scripts/backup-database.sh`
- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Verify data integrity

**If using new database:**
- [ ] Create new Supabase/PostgreSQL instance
- [ ] Run migrations on new database
- [ ] Update `DATABASE_URL` in Vercel

---

## 📋 Pre-Deployment Checklist

- [ ] Landing page backed up
- [ ] Landing page verified (looks correct)
- [ ] Database backup created (if using same DB)
- [ ] Environment variables documented
- [ ] New code tested locally
- [ ] Ready to push to GitHub

---

## 🎯 One-Command Deployment

```bash
# Complete deployment in one go
./scripts/preserve-landing-page.sh && \
git add . && \
git commit -m "feat: Deploy PayAid V3 (landing page preserved)" && \
git push origin main && \
echo "✅ Deployment initiated! Check Vercel dashboard for progress."
```

---

## 📊 Expected Timeline

| Step | Time | Status |
|------|------|--------|
| Backup landing page | 2 min | ✅ |
| Verify landing page | 2 min | ✅ |
| Push to GitHub | 3 min | ✅ |
| Vercel build | 10-15 min | ⏳ |
| Verify deployment | 5 min | ✅ |
| **Total** | **20-25 min** | |

---

## 🔍 Post-Deployment Monitoring

### First Hour:
- Check landing page every 15 minutes
- Monitor error logs in Vercel
- Check user feedback

### First 24 Hours:
- Monitor error rates
- Check database performance
- Verify all features working
- Collect user feedback

---

## 💡 Pro Tips

1. **Deploy during low-traffic hours** (if possible)
2. **Have team ready** to test immediately after deployment
3. **Keep backup accessible** for quick restore
4. **Monitor Vercel logs** during deployment
5. **Test critical user flows** right after deployment

---

**Last Updated:** January 15, 2026  
**Status:** Ready for Deployment
