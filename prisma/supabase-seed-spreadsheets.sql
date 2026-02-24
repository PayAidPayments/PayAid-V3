-- =============================================================================
-- Supabase manual seed: Demo spreadsheets for PayAid
-- =============================================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- Requires: A tenant with subdomain = 'demo' and a user with email = 'admin@demo.com'.
-- If you don't have them, create a tenant and user first, then replace the
-- subquery below with your actual tenant id and user id, or add them at the top.
-- =============================================================================

INSERT INTO "Spreadsheet" (id, "tenantId", name, description, data, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT
  'sheet-demo-1',
  (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1),
  'Q1 Sales Summary',
  'Quarterly sales and revenue tracking',
  '[
    ["Month", "Revenue", "Expenses", "Profit"],
    ["January", "₹2,50,000", "₹1,20,000", "₹1,30,000"],
    ["February", "₹2,80,000", "₹1,35,000", "₹1,45,000"],
    ["March", "₹3,10,000", "₹1,40,000", "₹1,70,000"],
    ["Total", "₹8,40,000", "₹3,95,000", "₹4,45,000"]
  ]'::jsonb,
  NULL, 1,
  (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1),
  (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1)
  AND EXISTS (SELECT 1 FROM "User" WHERE email = 'admin@demo.com' LIMIT 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, data = EXCLUDED.data, "updatedAt" = NOW();

INSERT INTO "Spreadsheet" (id, "tenantId", name, description, data, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT
  'sheet-demo-2',
  (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1),
  'Expense Tracker 2024',
  'Monthly expense tracking by category',
  '[
    ["Date", "Category", "Description", "Amount"],
    ["2024-01-05", "Office", "Supplies", "₹5,000"],
    ["2024-01-12", "Travel", "Client visit", "₹8,500"],
    ["2024-01-20", "Software", "Subscription", "₹12,000"],
    ["2024-02-01", "Marketing", "Ad campaign", "₹25,000"]
  ]'::jsonb,
  NULL, 1,
  (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1),
  (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1)
  AND EXISTS (SELECT 1 FROM "User" WHERE email = 'admin@demo.com' LIMIT 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, data = EXCLUDED.data, "updatedAt" = NOW();

INSERT INTO "Spreadsheet" (id, "tenantId", name, description, data, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT
  'sheet-demo-3',
  (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1),
  'GST Invoice Log',
  'Invoice register with GST details',
  '[
    ["Invoice #", "Date", "Customer", "Amount", "GST (18%)", "Total"],
    ["INV-001", "2024-01-15", "Acme Corp", "₹50,000", "₹9,000", "₹59,000"],
    ["INV-002", "2024-01-22", "Tech Solutions", "₹75,000", "₹13,500", "₹88,500"],
    ["INV-003", "2024-02-01", "StartupXYZ", "₹30,000", "₹5,400", "₹35,400"]
  ]'::jsonb,
  NULL, 1,
  (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1),
  (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1)
  AND EXISTS (SELECT 1 FROM "User" WHERE email = 'admin@demo.com' LIMIT 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, data = EXCLUDED.data, "updatedAt" = NOW();

INSERT INTO "Spreadsheet" (id, "tenantId", name, description, data, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT
  'sheet-demo-4',
  (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1),
  'Team Payroll - Feb 2024',
  'Employee salary and deductions',
  '[
    ["Employee", "Basic", "HRA", "Allowances", "Deductions", "Net"],
    ["John Doe", "₹45,000", "₹18,000", "₹5,000", "₹6,800", "₹61,200"],
    ["Jane Smith", "₹52,000", "₹20,800", "₹6,000", "₹7,900", "₹70,900"],
    ["Rajesh K.", "₹38,000", "₹15,200", "₹4,000", "₹5,700", "₹51,500"]
  ]'::jsonb,
  NULL, 1,
  (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1),
  (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1)
  AND EXISTS (SELECT 1 FROM "User" WHERE email = 'admin@demo.com' LIMIT 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, data = EXCLUDED.data, "updatedAt" = NOW();

INSERT INTO "Spreadsheet" (id, "tenantId", name, description, data, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT
  'sheet-demo-5',
  (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1),
  'Project Tracker',
  'Tasks and milestones',
  '[
    ["Project", "Owner", "Status", "Due Date", "Progress"],
    ["Website Redesign", "Jane", "In Progress", "2024-03-15", "60%"],
    ["API Integration", "John", "Done", "2024-02-28", "100%"],
    ["Mobile App", "Rajesh", "Planning", "2024-04-30", "10%"]
  ]'::jsonb,
  NULL, 1,
  (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1),
  (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1)
  AND EXISTS (SELECT 1 FROM "User" WHERE email = 'admin@demo.com' LIMIT 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, data = EXCLUDED.data, "updatedAt" = NOW();
