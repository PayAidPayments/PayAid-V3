# Initialize Roles - Simple Instructions

## ✅ Status
- Changes committed and pushed
- Vercel is deploying (wait 2-5 minutes)
- DATABASE_URL is configured

## 🚀 Run This Command

**After Vercel deployment completes, run:**

```bash
npx tsx scripts/initialize-roles-for-vercel.ts
```

This will:
1. Connect to your production database
2. Find all tenants
3. Create Admin, Manager, User roles for each
4. Show you the results

## ⏱️ When to Run

**Wait for:**
- Vercel deployment shows "Ready" ✅
- Or visit https://payaid-v3.vercel.app and it loads

**Then run the command above.**

## 🎯 That's It!

The script handles everything. Just run it when deployment is done.

---

**If you want to initialize for a specific tenant only:**

```bash
npx tsx scripts/initialize-roles-for-vercel.ts --tenant-id YOUR_TENANT_ID
```
