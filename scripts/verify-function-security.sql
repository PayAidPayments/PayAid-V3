-- Verification Query: Check if functions have SET search_path = ''
-- Run this in Supabase SQL Editor after applying the security fix

SELECT 
  p.proname as function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''%' THEN '✅ FIXED'
    ELSE '❌ NEEDS FIX'
  END as status,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('tenant_id', 'user_id', 'is_service_role', 'create_tenant_policies')
ORDER BY p.proname;

-- Expected output: All 4 functions should show "✅ FIXED"
-- If any show "❌ NEEDS FIX", run the migration: prisma/migrations/fix_function_search_path.sql

