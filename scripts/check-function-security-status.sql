-- Enhanced Verification Query: Check Function Security Status
-- This query shows clearly if functions are fixed or need fixing

SELECT 
  p.proname as function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''%' THEN '✅ FIXED'
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path=%' THEN '⚠️ PARTIAL (check manually)'
    ELSE '❌ NEEDS FIX'
  END as security_status,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SECURITY DEFINER%' THEN '✅ Yes'
    ELSE '❌ No'
  END as has_security_definer,
  LENGTH(pg_get_functiondef(p.oid)) as definition_length
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('tenant_id', 'user_id', 'is_service_role', 'create_tenant_policies')
ORDER BY p.proname;

-- Expected Result:
-- All 4 functions should show:
-- - security_status: ✅ FIXED
-- - has_security_definer: ✅ Yes
--
-- If any show ❌ NEEDS FIX, run: prisma/migrations/fix_function_search_path.sql

