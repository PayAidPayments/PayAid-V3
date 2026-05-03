-- =============================================================================
-- PayAid V3: Seed HR/Payroll Roles & Permissions (run manually in Supabase SQL Editor)
-- =============================================================================
-- Uses the first tenant in "Tenant" table. For a specific tenant, replace the
-- SELECT below with: v_tenant_id := 'your-tenant-cuid-here';
-- Tables: Role, Permission (existing Prisma schema). Safe to run multiple times.
-- =============================================================================

DO $$
DECLARE
  v_tenant_id text;
BEGIN
  -- Use first tenant (or replace with a fixed id for a specific tenant)
  SELECT id INTO v_tenant_id FROM "Tenant" LIMIT 1;
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found in "Tenant" table. Create a tenant first.';
  END IF;

  -- Permissions: HR module (idempotent)
  INSERT INTO "Permission" (id, "tenantId", "permissionCode", "description", "moduleName", action, "isSystem", "createdAt")
  VALUES
    (gen_random_uuid()::text, v_tenant_id, 'hr:read_employees', 'View employees', 'hr', 'read', true, now()),
    (gen_random_uuid()::text, v_tenant_id, 'hr:manage_employees', 'Create/update employees', 'hr', 'update', true, now()),
    (gen_random_uuid()::text, v_tenant_id, 'hr:read_payroll', 'View payroll and runs', 'hr', 'read', true, now()),
    (gen_random_uuid()::text, v_tenant_id, 'hr:manage_payroll', 'Run payroll, approve, disburse', 'hr', 'update', true, now()),
    (gen_random_uuid()::text, v_tenant_id, 'hr:approve_reimbursements', 'Approve reimbursement claims', 'hr', 'update', true, now()),
    (gen_random_uuid()::text, v_tenant_id, 'hr:admin', 'Full HR admin', 'hr', 'admin', true, now())
  ON CONFLICT ("tenantId", "permissionCode") DO NOTHING;

  -- Pre-built roles (idempotent)
  INSERT INTO "Role" (id, "tenantId", "roleName", description, "roleType", permissions, "isSystem", "isActive", "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid()::text, v_tenant_id, 'Admin', 'Full access', 'admin', '[]'::jsonb, true, true, now(), now()),
    (gen_random_uuid()::text, v_tenant_id, 'Payroll Manager', 'Run payroll, compliance, reports', 'manager', '[]'::jsonb, true, true, now(), now()),
    (gen_random_uuid()::text, v_tenant_id, 'Approver', 'Approve reimbursements and leave', 'user', '[]'::jsonb, true, true, now(), now()),
    (gen_random_uuid()::text, v_tenant_id, 'Viewer', 'View-only access', 'user', '[]'::jsonb, true, true, now(), now())
  ON CONFLICT ("tenantId", "roleName") DO NOTHING;
END $$;
