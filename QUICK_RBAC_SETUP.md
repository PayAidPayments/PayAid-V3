# Quick RBAC Setup for Vercel - 3 Steps

## ✅ Step 1: Set Environment Variable (2 minutes)

**Go to Vercel Dashboard:**
1. https://vercel.com/dashboard
2. Select **PayAid V3** project
3. **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `ENABLE_RBAC`
   - **Value**: `true`
   - **Environments**: ✅ Production ✅ Preview ✅ Development
6. Click **Save**

---

## ✅ Step 2: Deploy (Automatic)

The build command is already updated. Just push:

```bash
git add .
git commit -m "Enable RBAC on Vercel"
git push
```

**What happens:**
- Vercel runs `prisma generate`
- Vercel runs `prisma migrate deploy` (creates RBAC tables)
- Vercel builds the app
- **Wait 2-5 minutes for deployment**

---

## ✅ Step 3: Initialize Roles (After deployment)

**Option A: Via Script (Easiest)**

```bash
# Make sure DATABASE_URL is set to production
# Get it from: Vercel Dashboard → Settings → Environment Variables

# For all tenants
npx tsx scripts/initialize-roles-for-vercel.ts

# For specific tenant
npx tsx scripts/initialize-roles-for-vercel.ts --tenant-id YOUR_TENANT_ID
```

**Option B: Via API**

1. Login to get token: https://payaid-v3.vercel.app/login
2. Get token from browser DevTools → Application → Local Storage
3. Run:
```bash
curl -X POST https://payaid-v3.vercel.app/api/admin/initialize-roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "YOUR_TENANT_ID"}'
```

---

## ✅ Verify It Works

1. **Test Login**: https://payaid-v3.vercel.app/login
   - Should complete in < 2 seconds ✅

2. **Check JWT Token** (decode at https://jwt.io):
   - Should have `roles` array ✅
   - Should have `permissions` array ✅
   - Should have `modules` array ✅

3. **Check Vercel Logs**:
   - Should see: `[LOGIN] Roles and permissions resolved { usingLegacyRole: false }` ✅

---

## 🎉 Done!

RBAC is now fully enabled on Vercel!

**Next:** Assign roles to users and test permission checking.
