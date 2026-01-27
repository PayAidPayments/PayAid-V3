# Initialize Roles - Alternative Methods

## ⚠️ Issue
The script is timing out when run via automation. Here are **working alternatives**:

---

## ✅ Method 1: Run Script Yourself (Recommended)

**Open your terminal and run:**

```bash
cd "D:\Cursor Projects\PayAid V3"
npx tsx scripts/initialize-roles-for-vercel.ts
```

This will work better when run directly in your terminal.

---

## ✅ Method 2: Via Supabase Dashboard SQL (Fastest)

**If using Supabase, this is the fastest method:**

1. Go to: **Supabase Dashboard** → **SQL Editor**
2. Run this SQL (replace `YOUR_TENANT_ID`):

```sql
-- First, get your tenant ID
SELECT id, name FROM "Tenant";

-- Then run this for each tenant (replace TENANT_ID)
DO $$
DECLARE
  tenant_uuid TEXT := 'YOUR_TENANT_ID_HERE';
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
  )
  ON CONFLICT DO NOTHING;

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
  )
  ON CONFLICT DO NOTHING;

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
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Roles initialized for tenant: %', tenant_uuid;
END $$;
```

**To do for all tenants at once:**

```sql
-- Initialize roles for ALL tenants
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id, name FROM "Tenant" LOOP
    -- Admin Role
    INSERT INTO "Role" (id, "tenantId", "roleName", description, "roleType", "isSystem", "isActive", permissions, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      tenant_record.id,
      'Admin',
      'Full system access',
      'admin',
      true,
      true,
      '["*"]'::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING;

    -- Manager Role
    INSERT INTO "Role" (id, "tenantId", "roleName", description, "roleType", "isSystem", "isActive", permissions, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      tenant_record.id,
      'Manager',
      'Team management',
      'manager',
      false,
      true,
      '["crm:read", "crm:create", "crm:update", "crm:export"]'::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING;

    -- User Role
    INSERT INTO "Role" (id, "tenantId", "roleName", description, "roleType", "isSystem", "isActive", permissions, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      tenant_record.id,
      'User',
      'Basic access',
      'user',
      false,
      true,
      '["crm:read", "crm:create"]'::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Roles initialized for tenant: %', tenant_record.name;
  END LOOP;
END $$;
```

---

## ✅ Method 3: Via API Endpoint (After Login)

1. **Login** to get token: https://payaid-v3.vercel.app/login
2. **Get token** from browser DevTools → Application → Local Storage → `token`
3. **Get tenant ID** from login response or database
4. **Call API:**

```bash
curl -X POST https://payaid-v3.vercel.app/api/admin/initialize-roles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "YOUR_TENANT_ID"}'
```

---

## ✅ Method 4: Simplified Script (Run Locally)

Create a simpler version that you can run:

```bash
# Save this as init-roles-simple.ts and run:
npx tsx init-roles-simple.ts
```

---

## 🎯 Recommended: Use Method 2 (SQL)

**Fastest and most reliable:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the "for all tenants" SQL above
3. Run it
4. Done in 10 seconds!

---

## ✅ Verify It Worked

```sql
-- Check roles were created
SELECT t.name, r."roleName", r."roleType" 
FROM "Role" r
JOIN "Tenant" t ON r."tenantId" = t.id
ORDER BY t.name, r."roleName";
```

You should see Admin, Manager, User for each tenant.

---

**The SQL method is the fastest and most reliable!**
