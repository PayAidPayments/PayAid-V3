# Enable RBAC on Vercel - Step by Step Guide

## Prerequisites
- ✅ Login fix deployed and working
- ✅ Vercel project connected
- ✅ Database accessible from Vercel

---

## Step 1: Run Migrations on Vercel

### Option A: Via Vercel Build Command (Recommended)

1. Go to Vercel Dashboard → Your Project → Settings → Build & Development Settings
2. Update **Build Command** to:
   ```bash
   prisma generate && prisma migrate deploy && next build
   ```
3. Save changes
4. Trigger a new deployment (or push a commit)

### Option B: Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Link project (if not already linked)
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migrations locally (will use production DB)
npx prisma migrate deploy
```

### Option C: Via Supabase Dashboard (If using Supabase)

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `prisma/migrations/phase1-rls-policies.sql`
3. Paste and run in SQL Editor
4. Verify tables created: `SELECT * FROM "Role" LIMIT 1;`

---

## Step 2: Set Environment Variable in Vercel

### Via Vercel Dashboard:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Click **Add New**
3. Add:
   - **Key**: `ENABLE_RBAC`
   - **Value**: `true`
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** the application (or push a new commit)

### Via Vercel CLI:

```bash
vercel env add ENABLE_RBAC production
# Enter value: true
# Repeat for preview and development if needed
```

---

## Step 3: Initialize Default Roles

### Option A: Via Script (Recommended)

Create a one-time script to initialize roles for all tenants:

```bash
# Run locally (will connect to production DB)
npx tsx scripts/initialize-default-roles.ts
```

### Option B: Via API Endpoint (Create Admin Endpoint)

We can create an admin API endpoint to initialize roles. Let me create that for you.

### Option C: Manual SQL (If needed)

```sql
-- For each tenant, run:
INSERT INTO "Role" (id, "tenantId", "roleName", description, "roleType", "isSystem", "isActive", permissions)
VALUES 
  (gen_random_uuid(), 'YOUR_TENANT_ID', 'Admin', 'Full system access', 'admin', true, true, '["*"]'),
  (gen_random_uuid(), 'YOUR_TENANT_ID', 'Manager', 'Team management', 'manager', false, true, '[]'),
  (gen_random_uuid(), 'YOUR_TENANT_ID', 'User', 'Basic access', 'user', false, true, '[]');
```

---

## Step 4: Verify RBAC is Working

### 1. Check Vercel Logs

After redeploy, check logs for:
```
[LOGIN] Roles and permissions resolved { rolesCount: 1, usingLegacyRole: false }
```

### 2. Test Login

1. Login at https://payaid-v3.vercel.app/login
2. Should complete in < 2 seconds
3. Check browser console/network tab
4. Decode JWT token at https://jwt.io
5. Verify token contains:
   - `roles` array
   - `permissions` array
   - `modules` array

### 3. Verify Database

```sql
-- Check roles exist
SELECT * FROM "Role" WHERE "tenantId" = 'YOUR_TENANT_ID';

-- Check user roles
SELECT * FROM "UserRole" WHERE "tenantId" = 'YOUR_TENANT_ID';
```

---

## Troubleshooting

### Issue: Migrations fail on Vercel

**Solution:**
- Check DATABASE_URL is set correctly
- Verify database connection from Vercel
- Check Vercel build logs for errors
- Try running migrations manually via Supabase Dashboard

### Issue: ENABLE_RBAC not working

**Solution:**
- Verify environment variable is set in Vercel
- Check it's set for correct environment (Production/Preview)
- Redeploy after setting variable
- Check Vercel logs for `ENABLE_RBAC` value

### Issue: Roles not initializing

**Solution:**
- Check database connection
- Verify migrations ran successfully
- Check script output for errors
- Verify tenant IDs are correct

### Issue: Login still slow

**Solution:**
- Check Vercel logs for RBAC query times
- Verify RBAC tables exist
- Check if queries are timing out
- Consider increasing timeout values

---

## Quick Checklist

- [ ] Migrations run successfully on Vercel
- [ ] `ENABLE_RBAC=true` set in Vercel environment variables
- [ ] Application redeployed after env var change
- [ ] Default roles initialized for tenants
- [ ] Login tested and working
- [ ] JWT token contains roles/permissions
- [ ] Vercel logs show RBAC is active

---

## Next Steps After RBAC is Enabled

1. **Assign Roles to Users:**
   ```typescript
   import { assignRoleToUser } from '@/lib/rbac/roles'
   
   await assignRoleToUser({
     tenantId: 'tenant-id',
     userId: 'user-id',
     roleId: 'role-id',
   })
   ```

2. **Create Custom Roles:**
   ```typescript
   import { createRole } from '@/lib/rbac/roles'
   
   await createRole({
     tenantId: 'tenant-id',
     roleName: 'Sales Manager',
     roleType: 'custom',
     permissions: ['crm:read', 'crm:create', 'crm:update'],
   })
   ```

3. **Check Permissions:**
   ```typescript
   import { checkPermission } from '@/lib/rbac/permissions'
   
   const hasPermission = checkPermission(token, 'crm:read')
   ```

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check database connection
3. Verify environment variables
4. Test locally first with `ENABLE_RBAC=true`
