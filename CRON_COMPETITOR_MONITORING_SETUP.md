# Competitor Monitoring Cron Job Setup

**Date:** January 2025  
**Status:** ✅ Database Migration Complete | ⏳ Cron Job Setup Required

---

## ✅ **Completed Steps**

### 1. Database Migration
- ✅ Fixed schema relation error (`LocationTracking` → `Tenant`)
- ✅ Ran `npx prisma db push` - **SUCCESS**
- ✅ Database schema is now in sync
- ⚠️ Prisma client generation had a permission error (file locked) - will regenerate on next build

### 2. Cron Configuration
- ✅ Added `/api/cron/monitor-competitors` to `vercel.json`
- ✅ Scheduled to run daily at midnight (`0 0 * * *`)

---

## 🔧 **Next Steps: Set Up Cron Job**

### **Option 1: Vercel Cron (Recommended for Vercel Deployments)**

The cron job is already configured in `vercel.json`. After deploying to Vercel:

1. **Deploy to Vercel:**
   ```bash
   vercel deploy
   ```

2. **Verify in Vercel Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Go to **Settings → Cron Jobs**
   - Verify `/api/cron/monitor-competitors` is listed with schedule `0 0 * * *`

3. **Set Environment Variable:**
   - Go to **Settings → Environment Variables**
   - Add `CRON_SECRET` (if not already set):
     ```bash
     # Generate a secure secret:
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Add the generated value as `CRON_SECRET`

**Note:** Vercel Cron requires Vercel Pro plan or higher.

---

### **Option 2: GitHub Actions (Free Alternative)**

1. **Create `.github/workflows/cron-monitor-competitors.yml`:**

```yaml
name: Monitor Competitors

on:
  schedule:
    # Run daily at midnight UTC
    - cron: '0 0 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Call Monitor Competitors API
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/monitor-competitors \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

2. **Add Secrets in GitHub:**
   - Go to: **Settings → Secrets and variables → Actions**
   - Add `APP_URL`: Your production app URL (e.g., `https://app.payaid.com`)
   - Add `CRON_SECRET`: Secret token for authentication

3. **Enable Workflow:**
   - Go to **Actions** tab in GitHub
   - Enable the workflow

---

### **Option 3: External Cron Service**

#### **Using EasyCron, Cron-Job.org, or Similar:**

1. **Create a new cron job:**
   - URL: `https://your-app-url.com/api/cron/monitor-competitors`
   - Method: `POST`
   - Headers:
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     Content-Type: application/json
     ```
   - Schedule: `0 0 * * *` (Daily at midnight UTC)

2. **Test the endpoint:**
   ```bash
   curl -X POST https://your-app-url.com/api/cron/monitor-competitors \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     -H "Content-Type: application/json"
   ```

---

### **Option 4: Server Cron (Linux/Mac)**

1. **Create cron script:**
   ```bash
   # File: scripts/cron-monitor-competitors.sh
   #!/bin/bash
   
   APP_URL="https://your-app-url.com"
   CRON_SECRET="your-secret-token"
   
   curl -X POST "${APP_URL}/api/cron/monitor-competitors" \
     -H "Authorization: Bearer ${CRON_SECRET}" \
     -H "Content-Type: application/json"
   ```

2. **Make executable:**
   ```bash
   chmod +x scripts/cron-monitor-competitors.sh
   ```

3. **Add to crontab:**
   ```bash
   crontab -e
   ```
   
   Add this line:
   ```
   0 0 * * * /path/to/scripts/cron-monitor-competitors.sh
   ```

---

## 🔐 **Security: CRON_SECRET**

The cron endpoint is protected by the `CRON_SECRET` environment variable. Make sure:

1. **Generate a secure secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Set in your environment:**
   - Vercel: Settings → Environment Variables
   - Local: `.env` file
   - Server: Environment variables

3. **Never commit the secret** to version control

---

## 📊 **What the Cron Job Does**

The `/api/cron/monitor-competitors` endpoint:

1. **Finds all active competitors** with monitoring enabled
2. **Checks price changes** (if price tracking enabled)
3. **Checks location changes** (if location tracking enabled)
4. **Creates alerts** for significant changes
5. **Updates last checked timestamps**

**Returns:**
```json
{
  "success": true,
  "competitorsChecked": 5,
  "priceChecks": 12,
  "locationChecks": 8,
  "alertsCreated": 2
}
```

---

## 🧪 **Testing**

### **Manual Test (Local):**

1. **Set CRON_SECRET in `.env`:**
   ```
   CRON_SECRET=your-test-secret
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Test the endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/cron/monitor-competitors \
     -H "Authorization: Bearer your-test-secret" \
     -H "Content-Type: application/json"
   ```

### **Manual Test (Production):**

```bash
curl -X POST https://your-app-url.com/api/cron/monitor-competitors \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## 📝 **Schedule Options**

The current schedule is `0 0 * * *` (daily at midnight UTC). You can change it:

- **Every hour:** `0 * * * *`
- **Every 6 hours:** `0 */6 * * *`
- **Twice daily (9 AM & 9 PM):** `0 9,21 * * *`
- **Every Monday at 9 AM:** `0 9 * * 1`

**Cron Format:** `minute hour day month weekday`

---

## ✅ **Verification Checklist**

- [ ] Database migration completed successfully
- [ ] `vercel.json` updated with cron job
- [ ] `CRON_SECRET` environment variable set
- [ ] Cron job configured (Vercel/GitHub Actions/External)
- [ ] Manual test successful
- [ ] First scheduled run verified

---

## 🆘 **Troubleshooting**

### **Error: Unauthorized (401)**
- Check that `CRON_SECRET` is set correctly
- Verify the Authorization header format: `Bearer YOUR_SECRET`

### **Error: Database Connection**
- Verify `DATABASE_URL` is set correctly
- Check database is accessible

### **Error: No Competitors Found**
- This is normal if no competitors are configured
- Check that competitors have `monitoringEnabled: true`

---

## 📚 **Related Files**

- **Cron Endpoint:** `app/api/cron/monitor-competitors/route.ts`
- **Background Job:** `lib/background-jobs/monitor-competitors.ts`
- **Vercel Config:** `vercel.json`
- **Database Schema:** `prisma/schema.prisma`

---

**Last Updated:** January 2025

