# Post-Deployment Checklist

**Date:** December 31, 2025  
**Status:** ⏳ **PENDING COMPLETION**

---

## ✅ **Completed Automatically**

- ✅ Code pushed to GitHub
- ✅ Vercel auto-deployment triggered
- ✅ Build process started

---

## ⏳ **Manual Steps Required**

### **1. Database Migration** 🔴 **CRITICAL**

**Action:** Apply database schema changes to production

**Option A: Using Prisma (Recommended)**
```bash
# Connect to production database
npx prisma db push --skip-generate
```

**Option B: Using Vercel CLI**
```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Push schema
npx prisma db push --skip-generate
```

**Option C: Manual Migration**
- Use your database admin tool (Supabase, etc.)
- Run the migration SQL from `prisma/migrations/`

**Verify:**
- Check that these tables exist:
  - `SubscriptionPlan`
  - `SubscriptionInvoice`
  - `PaymentMethod`
  - `DunningAttempt`
  - `ModuleDefinition` (should already exist)

---

### **2. Seed Module Definitions** 🔴 **CRITICAL**

**Action:** Populate ModuleDefinition table with all 11 modules

**Command:**
```bash
npx tsx scripts/seed-modules.ts
```

**Or using Vercel CLI:**
```bash
vercel env pull .env.production
npx tsx scripts/seed-modules.ts
```

**Verify:**
- Check that all 11 modules exist:
  - crm, sales, marketing, finance, hr
  - communication, ai-studio, analytics
  - invoicing, accounting, whatsapp

---

### **3. Environment Variables** 🔴 **CRITICAL**

**Action:** Set required environment variables in Vercel Dashboard

**Steps:**
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following:

#### **Required Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Production database connection string | `postgresql://...` |
| `CRON_SECRET` | Secret for cron job authentication | Random 32+ char string |
| `ENCRYPTION_KEY` | AES-256 encryption key (64 hex chars) | `0123456789abcdef...` (64 chars) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | `https://...` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | `...` |

#### **Optional Variables:**

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Sentry error tracking DSN |
| `GOOGLE_CLIENT_ID` | Gmail OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Gmail OAuth client secret |

**Generate CRON_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Generate ENCRYPTION_KEY:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### **4. Configure Vercel Cron Jobs** 🟡 **HIGH PRIORITY**

**Action:** Set up scheduled cron jobs in Vercel

**Steps:**
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Cron Jobs
4. Add the following cron jobs:

#### **Cron Job 1: Scheduled Reports**
- **Path:** `/api/cron/process-scheduled-reports`
- **Schedule:** `0 * * * *` (Every hour)
- **Description:** Process scheduled reports

#### **Cron Job 2: Subscription Renewals**
- **Path:** `/api/cron/process-subscription-renewals`
- **Schedule:** `0 0 * * *` (Daily at midnight)
- **Description:** Process subscription renewals

**Alternative: Using vercel.json**
Add to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-scheduled-reports",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/process-subscription-renewals",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Note:** Cron jobs require Vercel Pro plan or higher.

---

### **5. Verify Deployment** 🟡 **HIGH PRIORITY**

**Action:** Test that everything works

#### **5.1 Check Deployment Status**
- Visit Vercel dashboard
- Verify latest deployment succeeded
- Check build logs for errors

#### **5.2 Test New API Endpoints**

**Subscription Plans:**
```bash
curl https://your-domain.vercel.app/api/subscriptions/plans \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Report Templates:**
```bash
curl https://your-domain.vercel.app/api/reports/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Payment Methods:**
```bash
curl https://your-domain.vercel.app/api/billing/payment-methods \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **5.3 Run Post-Deployment Script**
```bash
npx tsx scripts/post-deployment-setup.ts
```

This script will:
- ✅ Verify database connection
- ✅ Check if all tables exist
- ✅ Verify module definitions
- ✅ Check environment variables
- ✅ Seed modules if needed

---

### **6. Monitor Initial Deployment** 🟢 **MEDIUM PRIORITY**

**Actions:**
1. Monitor Vercel logs for first few hours
2. Check for any runtime errors
3. Verify cron jobs are executing
4. Monitor database connections

**Vercel Logs:**
- Go to: Vercel Dashboard → Your Project → Logs
- Filter by: Errors, Warnings
- Check cron job execution logs

---

## 📋 **Quick Reference Commands**

### **Run All Setup Steps:**
```bash
# 1. Verify and setup
npx tsx scripts/post-deployment-setup.ts

# 2. If modules missing, seed them
npx tsx scripts/seed-modules.ts

# 3. If schema missing, push it
npx prisma db push --skip-generate
```

### **Generate Secrets:**
```bash
# CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ **Completion Checklist**

- [ ] Database migration applied
- [ ] Module definitions seeded
- [ ] Environment variables set in Vercel
- [ ] Cron jobs configured
- [ ] Deployment verified
- [ ] API endpoints tested
- [ ] Post-deployment script run successfully
- [ ] Monitoring set up

---

## 🆘 **Troubleshooting**

### **Database Connection Issues:**
- Verify `DATABASE_URL` is correct
- Check database firewall settings
- Verify SSL requirements

### **Module Seeding Fails:**
- Check database connection
- Verify ModuleDefinition table exists
- Check for duplicate module IDs

### **Cron Jobs Not Running:**
- Verify Vercel Pro plan
- Check cron job configuration
- Verify `CRON_SECRET` is set
- Check cron job logs in Vercel

### **API Endpoints Return 500:**
- Check Vercel function logs
- Verify environment variables
- Check database connection
- Verify Prisma client is generated

---

**Last Updated:** December 31, 2025  
**Next Review:** After deployment completion

