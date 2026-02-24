-- =============================================================================
-- PayAid V3 – Productivity modules seed (Supabase)
-- =============================================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- Seeds: Docs (Document), Drive (DriveFile), Meet (Meeting), Slides (Presentation),
--        Spreadsheet. PDF Tools has no database table (tool-only module).
--
-- Requires: Tenant with subdomain = 'demo' and User with email = 'admin@demo.com'.
-- Safe to re-run: uses ON CONFLICT DO UPDATE where applicable.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DOCS – Demo documents (Tiptap JSON content)
-- -----------------------------------------------------------------------------
INSERT INTO "Document" (id, "tenantId", name, description, content, "htmlContent", version, "templateId", "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'doc-demo-1', t.id, 'Product Launch Brief', 'Q1 product launch overview', '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Product Launch Brief"}]},{"type":"paragraph","content":[{"type":"text","text":"Overview of the upcoming product launch for Q1 2024."}]},{"type":"paragraph","content":[{"type":"text","text":"Key features: Integration with CRM, automated reports, and mobile app."}]}]}'::jsonb, NULL, 1, NULL, u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, content = EXCLUDED.content, "updatedAt" = NOW();

INSERT INTO "Document" (id, "tenantId", name, description, content, "htmlContent", version, "templateId", "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'doc-demo-2', t.id, 'Meeting Notes – Strategy', 'Strategy call notes', '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Strategy Meeting Notes"}]},{"type":"paragraph","content":[{"type":"text","text":"Attendees: Team leads. Decisions: Prioritise API v2, move beta to March."}]}]}'::jsonb, NULL, 1, NULL, u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, content = EXCLUDED.content, "updatedAt" = NOW();

INSERT INTO "Document" (id, "tenantId", name, description, content, "htmlContent", version, "templateId", "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'doc-demo-3', t.id, 'Pricing Proposal', 'Draft pricing for enterprise', '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Pricing Proposal"}]},{"type":"paragraph","content":[{"type":"text","text":"Enterprise: Custom. Professional: ₹999/user/month. Starter: ₹299/user/month."}]}]}'::jsonb, NULL, 1, NULL, u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, content = EXCLUDED.content, "updatedAt" = NOW();

INSERT INTO "Document" (id, "tenantId", name, description, content, "htmlContent", version, "templateId", "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'doc-demo-4', t.id, 'Onboarding Checklist', 'New hire onboarding steps', '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Onboarding Checklist"}]},{"type":"paragraph","content":[{"type":"text","text":"1. Access setup 2. Product training 3. Shadow calls 4. First solo task."}]}]}'::jsonb, NULL, 1, NULL, u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, content = EXCLUDED.content, "updatedAt" = NOW();

-- -----------------------------------------------------------------------------
-- 2. DRIVE – Folders and placeholder files
-- -----------------------------------------------------------------------------
INSERT INTO "DriveFile" (id, "tenantId", name, "fileName", "fileUrl", "fileSize", "mimeType", "fileType", "parentId", version, "isShared", "sharedWith", tags, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'drive-demo-f1', t.id, 'Projects', 'Projects', '', 0, 'folder', 'folder', NULL, 1, false, NULL, '{}', u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW();

INSERT INTO "DriveFile" (id, "tenantId", name, "fileName", "fileUrl", "fileSize", "mimeType", "fileType", "parentId", version, "isShared", "sharedWith", tags, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'drive-demo-f2', t.id, 'Shared', 'Shared', '', 0, 'folder', 'folder', NULL, 1, false, NULL, '{}', u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW();

INSERT INTO "DriveFile" (id, "tenantId", name, "fileName", "fileUrl", "fileSize", "mimeType", "fileType", "parentId", version, "isShared", "sharedWith", tags, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'drive-demo-1', t.id, 'Q1 Report.pdf', 'Q1 Report.pdf', '/demo/files/q1-report.pdf', 245000, 'application/pdf', 'file', NULL, 1, false, NULL, '{}', u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW();

INSERT INTO "DriveFile" (id, "tenantId", name, "fileName", "fileUrl", "fileSize", "mimeType", "fileType", "parentId", version, "isShared", "sharedWith", tags, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'drive-demo-2', t.id, 'Contract Draft.docx', 'Contract Draft.docx', '/demo/files/contract-draft.docx', 52000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'file', NULL, 1, false, NULL, '{}', u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW();

INSERT INTO "DriveFile" (id, "tenantId", name, "fileName", "fileUrl", "fileSize", "mimeType", "fileType", "parentId", version, "isShared", "sharedWith", tags, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'drive-demo-3', t.id, 'Budget 2024.xlsx', 'Budget 2024.xlsx', '/demo/files/budget-2024.xlsx', 38000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'file', NULL, 1, false, NULL, '{}', u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW();

-- -----------------------------------------------------------------------------
-- 3. MEET – Demo meetings (unique meetingCode)
-- -----------------------------------------------------------------------------
INSERT INTO "Meeting" (id, "tenantId", title, description, "meetingCode", "startTime", "endTime", status, "hostId", participants, "recordingUrl", transcript, settings, "createdById", "createdAt", "updatedAt")
SELECT 'meet-demo-1', t.id, 'Weekly Standup', 'Team sync', 'DEMO0001', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '30 minutes', 'scheduled', u.id, NULL, NULL, NULL, NULL, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, "startTime" = EXCLUDED."startTime", "endTime" = EXCLUDED."endTime", "updatedAt" = NOW();

INSERT INTO "Meeting" (id, "tenantId", title, description, "meetingCode", "startTime", "endTime", status, "hostId", participants, "recordingUrl", transcript, settings, "createdById", "createdAt", "updatedAt")
SELECT 'meet-demo-2', t.id, 'Client Review', 'Q1 review with Acme', 'DEMO0002', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '1 hour', 'scheduled', u.id, NULL, NULL, NULL, NULL, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, "startTime" = EXCLUDED."startTime", "endTime" = EXCLUDED."endTime", "updatedAt" = NOW();

INSERT INTO "Meeting" (id, "tenantId", title, description, "meetingCode", "startTime", "endTime", status, "hostId", participants, "recordingUrl", transcript, settings, "createdById", "createdAt", "updatedAt")
SELECT 'meet-demo-3', t.id, 'Product Demo', 'Feature walkthrough', 'DEMO0003', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '45 minutes', 'scheduled', u.id, NULL, NULL, NULL, NULL, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, "startTime" = EXCLUDED."startTime", "endTime" = EXCLUDED."endTime", "updatedAt" = NOW();

INSERT INTO "Meeting" (id, "tenantId", title, description, "meetingCode", "startTime", "endTime", status, "hostId", participants, "recordingUrl", transcript, settings, "createdById", "createdAt", "updatedAt")
SELECT 'meet-demo-4', t.id, 'Training Session', 'Onboarding training', 'DEMO0004', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '2 hours', 'scheduled', u.id, NULL, NULL, NULL, NULL, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, "startTime" = EXCLUDED."startTime", "endTime" = EXCLUDED."endTime", "updatedAt" = NOW();

-- -----------------------------------------------------------------------------
-- 4. SLIDES – Demo presentations (slides JSON)
-- -----------------------------------------------------------------------------
INSERT INTO "Presentation" (id, "tenantId", name, description, slides, theme, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'slide-demo-1', t.id, 'Company Overview', 'Intro deck', '[{"id":"1","type":"title","content":{"title":"Company Overview","subtitle":"Demo Business Pvt Ltd"}},{"id":"2","type":"content","content":{"title":"Our Mission","body":"Simplify business operations with integrated tools."}}]'::jsonb, 'default', NULL, 1, u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, slides = EXCLUDED.slides, "updatedAt" = NOW();

INSERT INTO "Presentation" (id, "tenantId", name, description, slides, theme, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'slide-demo-2', t.id, 'Product Roadmap', '2024 roadmap', '[{"id":"1","type":"title","content":{"title":"Product Roadmap 2024","subtitle":"Key milestones"}},{"id":"2","type":"content","content":{"title":"Q1","body":"API v2, Mobile app beta."}},{"id":"3","type":"content","content":{"title":"Q2","body":"General availability, Integrations."}}]'::jsonb, 'default', NULL, 1, u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, slides = EXCLUDED.slides, "updatedAt" = NOW();

INSERT INTO "Presentation" (id, "tenantId", name, description, slides, theme, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'slide-demo-3', t.id, 'Sales Pitch', 'Enterprise pitch deck', '[{"id":"1","type":"title","content":{"title":"PayAid for Enterprise","subtitle":"One platform for your business"}},{"id":"2","type":"content","content":{"title":"Why PayAid","body":"CRM, Finance, HR, and Productivity in one place."}}]'::jsonb, 'default', NULL, 1, u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, slides = EXCLUDED.slides, "updatedAt" = NOW();

INSERT INTO "Presentation" (id, "tenantId", name, description, slides, theme, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'slide-demo-4', t.id, 'Quarterly Results', 'Q1 results summary', '[{"id":"1","type":"title","content":{"title":"Q1 Results","subtitle":"Demo Business"}},{"id":"2","type":"content","content":{"title":"Highlights","body":"Revenue up 20%, New customers +35%."}}]'::jsonb, 'default', NULL, 1, u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, slides = EXCLUDED.slides, "updatedAt" = NOW();

-- -----------------------------------------------------------------------------
-- 5. SPREADSHEET – Demo spreadsheets
-- -----------------------------------------------------------------------------
INSERT INTO "Spreadsheet" (id, "tenantId", name, description, data, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'sheet-demo-1', t.id, 'Q1 Sales Summary', 'Quarterly sales and revenue tracking', '[["Month","Revenue","Expenses","Profit"],["January","₹2,50,000","₹1,20,000","₹1,30,000"],["February","₹2,80,000","₹1,35,000","₹1,45,000"],["March","₹3,10,000","₹1,40,000","₹1,70,000"],["Total","₹8,40,000","₹3,95,000","₹4,45,000"]]'::jsonb, NULL, 1, u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, data = EXCLUDED.data, "updatedAt" = NOW();

INSERT INTO "Spreadsheet" (id, "tenantId", name, description, data, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'sheet-demo-2', t.id, 'Expense Tracker 2024', 'Monthly expense tracking by category', '[["Date","Category","Description","Amount"],["2024-01-05","Office","Supplies","₹5,000"],["2024-01-12","Travel","Client visit","₹8,500"],["2024-01-20","Software","Subscription","₹12,000"],["2024-02-01","Marketing","Ad campaign","₹25,000"]]'::jsonb, NULL, 1, u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, data = EXCLUDED.data, "updatedAt" = NOW();

INSERT INTO "Spreadsheet" (id, "tenantId", name, description, data, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'sheet-demo-3', t.id, 'GST Invoice Log', 'Invoice register with GST details', '[["Invoice #","Date","Customer","Amount","GST (18%)","Total"],["INV-001","2024-01-15","Acme Corp","₹50,000","₹9,000","₹59,000"],["INV-002","2024-01-22","Tech Solutions","₹75,000","₹13,500","₹88,500"],["INV-003","2024-02-01","StartupXYZ","₹30,000","₹5,400","₹35,400"]]'::jsonb, NULL, 1, u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, data = EXCLUDED.data, "updatedAt" = NOW();

INSERT INTO "Spreadsheet" (id, "tenantId", name, description, data, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'sheet-demo-4', t.id, 'Team Payroll - Feb 2024', 'Employee salary and deductions', '[["Employee","Basic","HRA","Allowances","Deductions","Net"],["John Doe","₹45,000","₹18,000","₹5,000","₹6,800","₹61,200"],["Jane Smith","₹52,000","₹20,800","₹6,000","₹7,900","₹70,900"],["Rajesh K.","₹38,000","₹15,200","₹4,000","₹5,700","₹51,500"]]'::jsonb, NULL, 1, u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, data = EXCLUDED.data, "updatedAt" = NOW();

INSERT INTO "Spreadsheet" (id, "tenantId", name, description, data, settings, version, "createdById", "updatedById", "createdAt", "updatedAt")
SELECT 'sheet-demo-5', t.id, 'Project Tracker', 'Tasks and milestones', '[["Project","Owner","Status","Due Date","Progress"],["Website Redesign","Jane","In Progress","2024-03-15","60%"],["API Integration","John","Done","2024-02-28","100%"],["Mobile App","Rajesh","Planning","2024-04-30","10%"]]'::jsonb, NULL, 1, u.id, u.id, NOW(), NOW()
FROM (SELECT id FROM "Tenant" WHERE subdomain = 'demo' LIMIT 1) t, (SELECT id FROM "User" WHERE email = 'admin@demo.com' LIMIT 1) u
WHERE t.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, data = EXCLUDED.data, "updatedAt" = NOW();

-- -----------------------------------------------------------------------------
-- PDF Tools: No database table; the module is tool-only (merge, split, convert, etc.).
-- No seed rows needed.
-- -----------------------------------------------------------------------------
