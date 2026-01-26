# Vercel Deployment Guide - Financial Dashboard Module

**Date:** January 2026  
**Status:** ✅ **Ready for Deployment**

---

## 🚀 **QUICK DEPLOYMENT**

### **Option 1: Automated Script (Recommended)**

**Windows (PowerShell):**
```powershell
.\scripts\vercel-deploy-financial-dashboard.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x scripts/vercel-deploy-financial-dashboard.sh
./scripts/vercel-deploy-financial-dashboard.sh
```

### **Option 2: Manual Steps**

Follow the steps below for manual deployment.

---

## 📋 **STEP-BY-STEP DEPLOYMENT**

### **Step 1: Prepare Git Repository**

1. **Check git status:**
   ```bash
   git status
   ```

2. **Stage all changes:**
   ```bash
   git add .
   ```

3. **Commit changes:**
   ```bash
   git commit -m "Financial Dashboard Module - Ready for Vercel deployment"
   ```

4. **Push to GitHub:**
   ```bash
   git push
   ```

---

### **Step 2: Deploy to Vercel**

#### **Option A: Via Vercel Dashboard (Recommended for First Time)**

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Sign in or create account

2. **Import Project:**
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install --legacy-peer-deps` (from vercel.json)

4. **Environment Variables:**
   - Add `DATABASE_URL` from your `.env` file
   - Add `CRON_SECRET` for cron jobs
   - Add any other required environment variables

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

#### **Option B: Via Vercel CLI**

1. **Install Vercel CLI (if not installed):**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Link Project:**
   ```bash
   vercel link
   ```

4. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

---

### **Step 3: Apply Database Schema**

After Vercel deployment, apply the database schema:

#### **Option A: Via Vercel CLI (Recommended)**

1. **Connect to Vercel project:**
   ```bash
   vercel link
   ```

2. **Run migration:**
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

#### **Option B: Via Vercel Dashboard**

1. **Go to Project Settings → Environment Variables**
2. **Copy `DATABASE_URL`**
3. **Run locally with production URL:**
   ```bash
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   ```

#### **Option C: Via Prisma Studio (For Development)**

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-url"
npx prisma db push
```

---

### **Step 4: Run Deployment Script**

After database schema is applied, run the automated deployment script:

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-url"

# Run deployment script
npx tsx scripts/deploy-financial-dashboard.ts
```

**This will automatically:**
- ✅ Apply materialized views (Step 3)
- ✅ Initialize all active tenants (Step 4)
- ✅ Sync existing financial data (Step 5)
- ✅ Enable module access (Step 9)

---

### **Step 5: Verify Deployment**

1. **Check Vercel Deployment:**
   - Go to Vercel Dashboard
   - Check deployment logs
   - Verify build succeeded

2. **Test API Endpoints:**
   ```bash
   # Dashboard snapshot
   curl https://your-app.vercel.app/api/v1/financials/dashboard

   # P&L
   curl https://your-app.vercel.app/api/v1/financials/p-and-l?startDate=2024-01-01&endDate=2024-12-31
   ```

3. **Test Frontend:**
   - Navigate to: `https://your-app.vercel.app/financials/dashboard`
   - Verify all components load
   - Test export functionality

4. **Verify Cron Jobs:**
   - Check Vercel Cron Jobs dashboard
   - Verify financial dashboard cron is scheduled
   - Test cron endpoint manually (with CRON_SECRET)

---

## 🔧 **VERCEL CONFIGURATION**

### **Current `vercel.json`:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "env": {
    "PRISMA_GENERATE_DATAPROXY": "false"
  },
  "crons": [
    {
      "path": "/api/cron/financial-dashboard",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### **Required Environment Variables:**

Add these in Vercel Dashboard → Project Settings → Environment Variables:

- `DATABASE_URL` - PostgreSQL connection string
- `CRON_SECRET` - Secret for cron job authentication
- `JWT_SECRET` - JWT token secret
- Any other environment variables from your `.env` file

---

## 📝 **POST-DEPLOYMENT CHECKLIST**

- [ ] Database schema applied
- [ ] Materialized views created
- [ ] Tenants initialized
- [ ] Data synchronized
- [ ] Module access enabled
- [ ] API endpoints tested
- [ ] Frontend verified
- [ ] Cron jobs configured
- [ ] Environment variables set
- [ ] Performance monitoring set up

---

## 🐛 **TROUBLESHOOTING**

### **Build Fails:**
- Check Vercel build logs
- Verify all environment variables are set
- Check Prisma client generation (should happen in postinstall)

### **Database Connection Issues:**
- Verify `DATABASE_URL` is correct
- Check database connection pool limits
- Ensure database allows connections from Vercel IPs

### **Cron Jobs Not Running:**
- Verify `CRON_SECRET` is set
- Check cron job path is correct
- Verify cron schedule in vercel.json

### **API Errors:**
- Check API logs in Vercel
- Verify database schema is applied
- Check module access is enabled for tenants

---

## ✅ **SUCCESS CRITERIA**

Deployment is successful when:
- ✅ Build completes without errors
- ✅ Database schema is applied
- ✅ API endpoints return data
- ✅ Frontend loads correctly
- ✅ Cron jobs are scheduled
- ✅ Financial Dashboard module is accessible

---

## 📞 **SUPPORT**

If you encounter issues:
1. Check Vercel deployment logs
2. Check Vercel function logs
3. Review database connection
4. Verify environment variables
5. Check Prisma client generation

---

**Status:** ✅ **Ready for Deployment**

**Next Action:** Run deployment script or follow manual steps above.