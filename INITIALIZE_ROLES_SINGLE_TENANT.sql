-- Initialize Roles for ONE Specific Tenant
-- Replace 'YOUR_TENANT_ID_HERE' with your actual tenant ID
-- To find your tenant ID, run: SELECT id, name FROM "Tenant";

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
