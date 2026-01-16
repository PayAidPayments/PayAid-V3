-- Update Demo Business Industry to Service Business
-- Run this in your database (Supabase SQL Editor, pgAdmin, or psql)

UPDATE "Tenant" 
SET 
  "industry" = 'service-business',
  "industrySubType" = NULL,
  "industrySettings" = '{"setForDemo": true, "setAt": "' || NOW()::text || '"}'::jsonb
WHERE 
  "subdomain" = 'demo' 
  OR "name" ILIKE '%Demo Business%';

-- Verify the update
SELECT 
  id,
  name,
  subdomain,
  industry,
  "industrySubType",
  "industrySettings"
FROM "Tenant"
WHERE "subdomain" = 'demo' OR "name" ILIKE '%Demo Business%';

