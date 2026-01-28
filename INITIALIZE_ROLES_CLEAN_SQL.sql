-- Initialize Roles for ALL Tenants
-- Copy and paste this ENTIRE block into Supabase SQL Editor
-- No modifications needed - it will create roles for all tenants automatically

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
      tenant_record.id,
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
      tenant_record.id,
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

    RAISE NOTICE 'Roles initialized for tenant: %', tenant_record.name;
  END LOOP;
END $$;
