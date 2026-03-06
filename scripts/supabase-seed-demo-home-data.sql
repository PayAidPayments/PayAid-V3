-- =============================================================================
-- Supabase: Add shared demo data for the demo tenant (subdomain = 'demo')
-- Same data used by Home, HR/Payroll, CRM, and Finance. No deletes.
--
-- How to run:
--   1. In Supabase Dashboard: SQL Editor → New query → paste this file → Run.
--   2. Ensure the demo tenant exists first (run app seed: npm run db:seed with
--      DATABASE_URL pointing to Supabase, or create the demo tenant manually).
--
-- What it adds (idempotent; safe to run again):
--   - 1 Department "General", 1 Designation "Staff"
--   - 4 Employees (DEMO-HOME-1/2/3/4) linked to that dept/designation (matches Home KPI + HR list)
--   - 2 open Deals, 2 Tasks, 2 Invoices (1 sent, 1 paid)
--
-- If you get "Demo tenant not found", run the main Prisma seed against this DB
-- so that a Tenant with subdomain 'demo' and at least one User and Contact exist.
-- =============================================================================

DO $$
DECLARE
  v_tenant_id   text;
  v_user_id     text;
  v_contact_id  text;
  v_dept_id     text;
  v_design_id   text;
  v_now         timestamptz := now();
  v_inv_date    timestamptz;
  v_due_date    timestamptz;
  v_join_date   timestamptz;
  v_exp_close_1 timestamptz;
  v_exp_close_2 timestamptz;
  v_due_1       timestamptz;
  v_due_2       timestamptz;
  v_paid_at     timestamptz;
BEGIN
  -- Resolve demo tenant and first user + contact
  SELECT t.id INTO v_tenant_id
  FROM "Tenant" t
  WHERE t.subdomain = 'demo'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Demo tenant (subdomain demo) not found. Run main seed first (e.g. npm run db:seed).';
  END IF;

  SELECT u.id INTO v_user_id
  FROM "User" u
  WHERE u."tenantId" = v_tenant_id
  ORDER BY u."createdAt" ASC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found for demo tenant. Run main seed first.';
  END IF;

  SELECT c.id INTO v_contact_id
  FROM "Contact" c
  WHERE c."tenantId" = v_tenant_id
  ORDER BY c."createdAt" ASC
  LIMIT 1;

  IF v_contact_id IS NULL THEN
    RAISE EXCEPTION 'No contact found for demo tenant. Run main seed first.';
  END IF;

  -- Derived dates
  v_join_date   := v_now - interval '180 days';
  v_exp_close_1 := v_now + interval '14 days';
  v_exp_close_2 := v_now + interval '21 days';
  v_inv_date    := v_now - interval '5 days';
  v_due_date    := v_inv_date + interval '30 days';
  v_due_1       := v_now + interval '2 days';
  v_due_2       := v_now + interval '1 day';
  v_paid_at     := v_now - interval '10 days';

  -- ---------------------------------------------------------------------------
  -- Department (for HR/Payroll)
  -- ---------------------------------------------------------------------------
  INSERT INTO "Department" (id, name, code, "tenantId", "isActive", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid()::text,
    'General',
    'GEN',
    v_tenant_id,
    true,
    v_now,
    v_now
  )
  ON CONFLICT ("tenantId", name)
  DO UPDATE SET "updatedAt" = v_now
  RETURNING id INTO v_dept_id;

  -- If ON CONFLICT DO UPDATE ran, we need the existing id
  IF v_dept_id IS NULL THEN
    SELECT id INTO v_dept_id FROM "Department"
    WHERE "tenantId" = v_tenant_id AND name = 'General' LIMIT 1;
  END IF;

  -- ---------------------------------------------------------------------------
  -- Designation (for HR/Payroll)
  -- ---------------------------------------------------------------------------
  INSERT INTO "Designation" (id, name, code, "tenantId", "isActive", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid()::text,
    'Staff',
    'STF',
    v_tenant_id,
    true,
    v_now,
    v_now
  )
  ON CONFLICT ("tenantId", name)
  DO UPDATE SET "updatedAt" = v_now
  RETURNING id INTO v_design_id;

  IF v_design_id IS NULL THEN
    SELECT id INTO v_design_id FROM "Designation"
    WHERE "tenantId" = v_tenant_id AND name = 'Staff' LIMIT 1;
  END IF;

  -- ---------------------------------------------------------------------------
  -- Employees (4) – same records on Home & HR/Payroll (support pages show same count)
  -- ---------------------------------------------------------------------------
  INSERT INTO "Employee" (
    id, "employeeCode", "firstName", "lastName", "officialEmail",
    "mobileCountryCode", "mobileNumber", "joiningDate", status,
    "departmentId", "designationId", "tenantId", "createdAt", "updatedAt"
  ) VALUES
    (gen_random_uuid()::text, 'DEMO-HOME-1', 'Demo', 'Employee 1', 'demo-home-1@demobusiness.com', '+91', '9876500003', v_join_date, 'ACTIVE', v_dept_id, v_design_id, v_tenant_id, v_now, v_now),
    (gen_random_uuid()::text, 'DEMO-HOME-2', 'Demo', 'Employee 2', 'demo-home-2@demobusiness.com', '+91', '9876500004', v_join_date, 'ACTIVE', v_dept_id, v_design_id, v_tenant_id, v_now, v_now),
    (gen_random_uuid()::text, 'DEMO-HOME-3', 'Demo', 'Employee 3', 'demo-home-3@demobusiness.com', '+91', '9876500005', v_join_date, 'ACTIVE', v_dept_id, v_design_id, v_tenant_id, v_now, v_now),
    (gen_random_uuid()::text, 'DEMO-HOME-4', 'Demo', 'Employee 4', 'demo-home-4@demobusiness.com', '+91', '9876500006', v_join_date, 'ACTIVE', v_dept_id, v_design_id, v_tenant_id, v_now, v_now)
  ON CONFLICT ("tenantId", "employeeCode")
  DO UPDATE SET
    "departmentId" = EXCLUDED."departmentId",
    "designationId" = EXCLUDED."designationId",
    "updatedAt" = v_now;

  -- ---------------------------------------------------------------------------
  -- Deals (2 open) – same records on Home & CRM
  -- ---------------------------------------------------------------------------
  INSERT INTO "Deal" (id, name, value, probability, stage, "expectedCloseDate", "tenantId", "contactId", "createdAt", "updatedAt")
  VALUES
    ('add-demo-home-deal-1', 'Demo Home Deal - Pipeline', 75000, 70, 'negotiation', v_exp_close_1, v_tenant_id, v_contact_id, v_now, v_now),
    ('add-demo-home-deal-2', 'Demo Home Deal - Qualified', 50000, 45, 'qualified', v_exp_close_2, v_tenant_id, v_contact_id, v_now, v_now)
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------------------
  -- Tasks (2 pending) – same records on Home & CRM
  -- ---------------------------------------------------------------------------
  INSERT INTO "Task" (id, title, description, priority, status, "dueDate", "tenantId", "contactId", "assignedToId", "createdAt", "updatedAt")
  VALUES
    ('add-demo-home-task-1', 'Demo Home Task - Follow up', 'Added for home dashboard demo', 'medium', 'pending', v_due_1, v_tenant_id, v_contact_id, v_user_id, v_now, v_now),
    ('add-demo-home-task-2', 'Demo Home Task - Review', 'Added for home dashboard demo', 'high', 'in_progress', v_due_2, v_tenant_id, v_contact_id, v_user_id, v_now, v_now)
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------------------
  -- Invoices (1 sent, 1 paid) – same records on Home & Finance
  -- ---------------------------------------------------------------------------
  INSERT INTO "Invoice" (
    id, "invoiceNumber", status, subtotal, tax, total, "gstRate", "gstAmount",
    "invoiceDate", "dueDate", "tenantId", "customerId", "createdAt", "updatedAt"
  ) VALUES
    (
      'add-demo-home-inv-1',
      'INV-DEMO-HOME-001',
      'sent',
      85000 / 1.18,
      85000 - (85000 / 1.18),
      85000,
      18,
      85000 - (85000 / 1.18),
      v_inv_date,
      v_due_date,
      v_tenant_id,
      v_contact_id,
      v_now,
      v_now
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO "Invoice" (
    id, "invoiceNumber", status, subtotal, tax, total, "gstRate", "gstAmount",
    "invoiceDate", "dueDate", "paidAt", "tenantId", "customerId", "createdAt", "updatedAt"
  ) VALUES
    (
      'add-demo-home-inv-2',
      'INV-DEMO-HOME-002',
      'paid',
      45000 / 1.18,
      45000 - (45000 / 1.18),
      45000,
      18,
      45000 - (45000 / 1.18),
      v_paid_at - interval '15 days',
      v_paid_at + interval '10 days',
      v_paid_at,
      v_tenant_id,
      v_contact_id,
      v_now,
      v_now
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Shared demo data added for tenant %. Same data used by Home, HR/Payroll, CRM, Finance.', v_tenant_id;
END $$;
