# Initialize Roles - Ready to Run

## ✅ Deployment Status

**Commit:** `6628e5e2` - "Enable RBAC - update build commands"  
**Status:** Pushed to GitHub, Vercel is deploying...

**Wait 2-5 minutes for deployment to complete before running role initialization.**

---

## Step 1: Wait for Deployment

**Check Vercel Dashboard:**
1. Go to: https://vercel.com/dashboard
2. Select: **PayAid V3** project
3. Check latest deployment status
4. Wait for status: **Ready** ✅

**Or check via URL:**
- Visit: https://payaid-v3.vercel.app
- If site loads, deployment is complete

---

## Step 2: Get Production DATABASE_URL

**Option A: From Vercel Dashboard**
1. Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. Copy the value
4. Set it locally: `export DATABASE_URL="your-production-url"` (Linux/Mac) or add to `.env` file

**Option B: From Vercel CLI**
```bash
vercel env pull .env.production
# DATABASE_URL will be in .env.production file
```

**Option C: Use Existing .env**
If your `.env` already has the production DATABASE_URL, you're good to go!

---

## Step 3: Initialize Roles

### Option A: For All Tenants (Recommended)

```bash
# Make sure DATABASE_URL is set to production
npx tsx scripts/initialize-roles-for-vercel.ts
```

**What it does:**
- Connects to production database
- Finds all tenants
- Creates Admin, Manager, User roles for each tenant
- Shows progress and summary

### Option B: For Specific Tenant

First, get your tenant ID:

**Via Database:**
```sql
SELECT id, name FROM "Tenant";
```

**Via API (after login):**
- Login to get token
- Check response for `tenant.id`

Then run:
```bash
npx tsx scripts/initialize-roles-for-vercel.ts --tenant-id YOUR_TENANT_ID
```

---

## Step 4: Verify Roles Created

**Check Database:**
```sql
-- Check roles exist
SELECT * FROM "Role" WHERE "tenantId" = 'YOUR_TENANT_ID';
-- Should show: Admin, Manager, User (3 roles)
```

**Or via Script Output:**
The script will show:
```
✅ Successfully initialized 3 default roles:
   - Admin (admin)
   - Manager (manager)
   - User (user)
```

---

## Step 5: Test Login

1. **Login:** https://payaid-v3.vercel.app/login
2. **Should complete in < 2 seconds** ✅
3. **Check JWT Token** (decode at https://jwt.io):
   - Should have `roles` array
   - Should have `permissions` array
   - Should have `modules` array

---

## Troubleshooting

### Issue: "DATABASE_URL not set"

**Solution:**
```bash
# Set it temporarily
export DATABASE_URL="your-production-url"

# Or add to .env file
echo 'DATABASE_URL="your-production-url"' >> .env
```

### Issue: "RBAC tables do not exist"

**Solution:**
- Wait for Vercel deployment to complete
- Check Vercel build logs for migration errors
- Or run migrations manually via Supabase Dashboard SQL Editor

### Issue: "Tenant not found"

**Solution:**
- Verify tenant ID is correct
- Check database: `SELECT id, name FROM "Tenant";`
- Use correct tenant ID in command

### Issue: Script hangs

**Solution:**
- Check database connection
- Verify DATABASE_URL is correct
- Check if database is accessible from your network
- Try connecting via Supabase Dashboard first

---

## Quick Command Reference

```bash
# Set production database URL (if needed)
export DATABASE_URL="postgresql://..."

# Initialize for all tenants
npx tsx scripts/initialize-roles-for-vercel.ts

# Initialize for specific tenant
npx tsx scripts/initialize-roles-for-vercel.ts --tenant-id clx123...

# Check roles created
npx prisma studio
# Then browse to Role table
```

---

## Next Steps After Initialization

1. **Assign Roles to Users:**
   - Via API: `POST /api/admin/assign-role`
   - Via Database: Insert into `UserRole` table
   - Via Admin Panel (if you have one)

2. **Test Permission Checking:**
   ```typescript
   import { checkPermission } from '@/lib/rbac/permissions'
   const hasPermission = checkPermission(token, 'crm:read')
   ```

3. **Create Custom Roles:**
   ```typescript
   import { createRole } from '@/lib/rbac/roles'
   await createRole({ tenantId, roleName: 'Sales Manager', ... })
   ```

---

## Ready to Run?

1. ✅ Wait for Vercel deployment (2-5 min)
2. ✅ Set DATABASE_URL to production
3. ✅ Run: `npx tsx scripts/initialize-roles-for-vercel.ts`
4. ✅ Verify roles created
5. ✅ Test login

**Once deployment is ready, you can run the initialization script!**
