# Vercel RBAC Setup - Complete Checklist

## ✅ Automated Steps (Done)

1. ✅ **Build Command Updated**
   - `package.json` now includes `prisma migrate deploy` in build command
   - Migrations will run automatically on each deployment

2. ✅ **Helper Scripts Created**
   - `scripts/vercel-setup-rbac.sh` - Sets environment variables via CLI
   - `scripts/initialize-roles-for-vercel.ts` - Initializes roles for production

3. ✅ **API Endpoint Created**
   - `POST /api/admin/initialize-roles` - Initialize roles via API

---

## 📋 Manual Steps Required

### Step 1: Set Environment Variable in Vercel Dashboard

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to: https://vercel.com/dashboard
2. Select your project: **PayAid V3**
3. Go to: **Settings** → **Environment Variables**
4. Click: **Add New**
5. Enter:
   - **Key**: `ENABLE_RBAC`
   - **Value**: `true`
   - **Environment**: Select all three (Production, Preview, Development)
6. Click: **Save**
7. **Redeploy** the application (or it will auto-deploy on next push)

**Option B: Via Vercel CLI**
```bash
# Install Vercel CLI if needed
npm install -g vercel

# Login
vercel login

# Link project (if not already)
vercel link

# Set environment variable
vercel env add ENABLE_RBAC production
# Enter: true
# Repeat for preview and development
```

**Option C: Via Script**
```bash
# Run the helper script
bash scripts/vercel-setup-rbac.sh
```

---

### Step 2: Deploy Changes

The build command is already updated in `package.json`. Just push:

```bash
git add .
git commit -m "Enable RBAC - update build command"
git push
```

Vercel will automatically:
1. Run `prisma generate`
2. Run `prisma migrate deploy` (creates RBAC tables)
3. Build the application

**Wait for deployment to complete** (check Vercel dashboard)

---

### Step 3: Initialize Default Roles

**Option A: Via Script (Recommended)**

```bash
# Make sure DATABASE_URL points to production
# You can get it from Vercel Dashboard → Settings → Environment Variables

# For all tenants
npx tsx scripts/initialize-roles-for-vercel.ts

# For specific tenant
npx tsx scripts/initialize-roles-for-vercel.ts --tenant-id YOUR_TENANT_ID
```

**Option B: Via API Endpoint**

1. **Get your auth token:**
   - Login at https://payaid-v3.vercel.app/login
   - Get token from browser localStorage or network tab

2. **Call the API:**
```bash
curl -X POST https://payaid-v3.vercel.app/api/admin/initialize-roles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "YOUR_TENANT_ID"}'
```

**Option C: Via Supabase Dashboard (If using Supabase)**

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL (replace `YOUR_TENANT_ID`):

```sql
-- Get tenant ID first
SELECT id, name FROM "Tenant";

-- Then initialize roles (replace TENANT_ID)
DO $$
DECLARE
  tenant_uuid TEXT := 'YOUR_TENANT_ID_HERE';
  admin_role_id TEXT;
  manager_role_id TEXT;
  user_role_id TEXT;
BEGIN
  -- Admin Role
  INSERT INTO "Role" (id, "tenantId", "roleName", description, "roleType", "isSystem", "isActive", permissions, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(),
    tenant_uuid,
    'Admin',
    'Full system access with tenant management',
    'admin',
    true,
    true,
    '["*"]'::jsonb,
    NOW(),
    NOW()
  ) RETURNING id INTO admin_role_id;

  -- Manager Role
  INSERT INTO "Role" (id, "tenantId", "roleName", description, "roleType", "isSystem", "isActive", permissions, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(),
    tenant_uuid,
    'Manager',
    'Can manage team and view reports',
    'manager',
    false,
    true,
    '["crm:read", "crm:create", "crm:update", "crm:export", "hr:read", "hr:update", "accounting:read", "communication:read", "communication:create"]'::jsonb,
    NOW(),
    NOW()
  ) RETURNING id INTO manager_role_id;

  -- User Role
  INSERT INTO "Role" (id, "tenantId", "roleName", description, "roleType", "isSystem", "isActive", permissions, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(),
    tenant_uuid,
    'User',
    'Basic access to assigned modules',
    'user',
    false,
    true,
    '["crm:read", "crm:create", "crm:update_own", "communication:read", "communication:create", "hr:read_own"]'::jsonb,
    NOW(),
    NOW()
  ) RETURNING id INTO user_role_id;

  RAISE NOTICE 'Roles initialized: Admin=%, Manager=%, User=%', admin_role_id, manager_role_id, user_role_id;
END $$;
```

---

## ✅ Verification Steps

### 1. Check Migrations Ran

**Via Vercel Logs:**
- Go to Vercel Dashboard → Deployments → Latest → Build Logs
- Look for: `Running migrations...` or `Prisma Migrate`

**Via Database:**
```sql
-- Check if RBAC tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('Role', 'UserRole', 'Permission', 'RolePermission', 'UserPermission', 'ModuleAccess');
```

### 2. Check Environment Variable

**Via Vercel Dashboard:**
- Settings → Environment Variables
- Verify `ENABLE_RBAC=true` exists for all environments

**Via Vercel Logs:**
- After deployment, check function logs
- Should see: `[LOGIN] Roles and permissions resolved` (not "using legacy role")

### 3. Check Roles Initialized

```sql
-- Check roles exist
SELECT * FROM "Role" WHERE "tenantId" = 'YOUR_TENANT_ID';
-- Should show: Admin, Manager, User
```

### 4. Test Login

1. Login at https://payaid-v3.vercel.app/login
2. Should complete in < 2 seconds
3. Decode JWT token at https://jwt.io
4. Verify token contains:
   - `roles`: `["admin"]` or `["user"]` etc.
   - `permissions`: Array of permissions
   - `modules`: Array of enabled modules

### 5. Check Vercel Logs

After login, check Vercel function logs:
```
[LOGIN] Roles and permissions resolved { 
  rolesCount: 1, 
  permissionsCount: X, 
  usingLegacyRole: false  // Should be false!
}
```

---

## 🚨 Troubleshooting

### Issue: Migrations not running

**Check:**
- Build command in `package.json` includes `prisma migrate deploy`
- Vercel build logs show migration output
- DATABASE_URL is set correctly

**Fix:**
- Manually run migrations via Supabase Dashboard SQL Editor
- Or update Vercel build command directly in dashboard

### Issue: ENABLE_RBAC not working

**Check:**
- Environment variable is set in Vercel
- Set for correct environment (Production/Preview)
- Application was redeployed after setting variable

**Fix:**
- Verify in Vercel Dashboard → Settings → Environment Variables
- Redeploy after setting variable

### Issue: Roles not initializing

**Check:**
- RBAC tables exist (run verification SQL above)
- Tenant ID is correct
- Database connection works

**Fix:**
- Run initialization script with correct tenant ID
- Check script output for errors
- Verify database connection

### Issue: Login still using legacy role

**Check:**
- `ENABLE_RBAC=true` is set
- RBAC tables exist
- Roles are initialized
- Vercel logs show RBAC is active

**Fix:**
- Verify all steps above
- Check Vercel function logs
- Test with fresh login

---

## 📝 Quick Reference

### Environment Variables Needed
```
ENABLE_RBAC=true
DATABASE_URL=your-production-database-url
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Build Command (Auto-configured)
```bash
prisma generate && prisma migrate deploy && next build --webpack
```

### Initialize Roles Command
```bash
npx tsx scripts/initialize-roles-for-vercel.ts
```

### API Endpoint
```
POST /api/admin/initialize-roles
Authorization: Bearer <token>
Body: { "tenantId": "tenant-id" }
```

---

## ✅ Final Checklist

- [ ] Environment variable `ENABLE_RBAC=true` set in Vercel
- [ ] Changes pushed and deployed
- [ ] Migrations ran successfully (check build logs)
- [ ] RBAC tables exist in database
- [ ] Default roles initialized for tenants
- [ ] Login tested and working
- [ ] JWT token contains roles/permissions
- [ ] Vercel logs show RBAC is active (not legacy)

---

**Once all steps are complete, RBAC will be fully enabled on Vercel!** 🎉
