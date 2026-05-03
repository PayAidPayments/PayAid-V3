# RBAC Setup - Step by Step

## ⚠️ Error: "Role table does not exist"

This means the migrations haven't run yet. Follow these steps:

---

## Step 1: Create RBAC Tables

**Go to Supabase Dashboard → SQL Editor**

**Run this SQL first** (from `CREATE_RBAC_TABLES.sql`):

```sql
-- Copy the entire contents of CREATE_RBAC_TABLES.sql
-- This creates all 6 RBAC tables
```

Or copy the SQL from `CREATE_RBAC_TABLES.sql` file in your project.

**This will create:**
- ✅ Role table
- ✅ UserRole table
- ✅ Permission table
- ✅ RolePermission table
- ✅ UserPermission table
- ✅ ModuleAccess table

---

## Step 2: Verify Tables Created

**Run this to verify:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('Role', 'UserRole', 'Permission', 'RolePermission', 'UserPermission', 'ModuleAccess')
ORDER BY table_name;
```

**You should see 6 tables listed.**

---

## Step 3: Initialize Roles

**Now run the role initialization SQL** (from `INITIALIZE_ROLES_CLEAN_SQL.sql`):

```sql
-- Copy the SQL from INITIALIZE_ROLES_CLEAN_SQL.sql
-- This creates Admin, Manager, User roles for all tenants
```

---

## Step 4: Verify Roles Created

**Check if roles were created:**

```sql
SELECT t.name as tenant_name, r."roleName", r."roleType"
FROM "Role" r
JOIN "Tenant" t ON r."tenantId" = t.id
ORDER BY t.name, r."roleName";
```

**You should see:**
- Admin, Manager, User for each tenant

---

## Alternative: Wait for Vercel Deployment

**If you prefer to wait for automatic migration:**

1. **Check Vercel Dashboard** → Latest deployment
2. **Look for build logs** showing:
   - `Running migrations...`
   - `Prisma Migrate`
3. **Wait for deployment to complete**
4. **Then run Step 3** (initialize roles)

---

## Quick Summary

1. ✅ **Create tables**: Run `CREATE_RBAC_TABLES.sql`
2. ✅ **Verify**: Check tables exist
3. ✅ **Initialize roles**: Run `INITIALIZE_ROLES_CLEAN_SQL.sql`
4. ✅ **Verify roles**: Check roles were created
5. ✅ **Test login**: Should work with RBAC now!

---

**The tables need to exist before you can create roles!**
