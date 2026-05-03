-- Assign Admin Role to First User
-- Run this to assign Admin role to your user account
-- Replace YOUR_TENANT_ID and YOUR_USER_EMAIL with your actual values

-- Step 1: Find your user ID and tenant ID
SELECT u.id as user_id, u.email, u."tenantId", t.name as tenant_name
FROM "User" u
JOIN "Tenant" t ON u."tenantId" = t.id
WHERE u.email = 'YOUR_EMAIL_HERE';

-- Step 2: Find Admin role ID for your tenant
SELECT r.id as role_id, r."roleName", r."tenantId"
FROM "Role" r
WHERE r."tenantId" = 'YOUR_TENANT_ID'
  AND r."roleName" = 'Admin';

-- Step 3: Assign Admin role to user (replace IDs from above)
INSERT INTO "UserRole" ("tenantId", "userId", "roleId", "assignedAt")
VALUES (
  'YOUR_TENANT_ID',  -- From Step 1
  'YOUR_USER_ID',    -- From Step 1
  'YOUR_ROLE_ID',    -- From Step 2 (Admin role ID)
  NOW()
)
ON CONFLICT ("tenantId", "userId", "roleId") DO NOTHING;

-- Step 4: Verify assignment
SELECT u.email, r."roleName", ur."assignedAt"
FROM "UserRole" ur
JOIN "User" u ON ur."userId" = u.id
JOIN "Role" r ON ur."roleId" = r.id
WHERE u.email = 'YOUR_EMAIL_HERE';

-- OR: One-liner if you know your email
INSERT INTO "UserRole" ("tenantId", "userId", "roleId", "assignedAt")
SELECT 
  u."tenantId",
  u.id,
  r.id,
  NOW()
FROM "User" u
CROSS JOIN "Role" r
WHERE u.email = 'YOUR_EMAIL_HERE'
  AND r."roleName" = 'Admin'
  AND r."tenantId" = u."tenantId"
ON CONFLICT DO NOTHING;
