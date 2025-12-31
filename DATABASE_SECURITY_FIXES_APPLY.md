# Database Security Fixes - Application Guide

## 🔐 Function Search Path Security Fix

This guide helps you apply the database security fixes to resolve Supabase Security Advisor warnings.

---

## Step 1: Verify Current Status

Run this query in **Supabase SQL Editor** to check if fixes are needed:

```sql
SELECT 
  p.proname as function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path = ''%' THEN '✅ FIXED'
    ELSE '❌ NEEDS FIX'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('tenant_id', 'user_id', 'is_service_role', 'create_tenant_policies')
ORDER BY p.proname;
```

**If all show `✅ FIXED`:** You're done! ✅  
**If any show `❌ NEEDS FIX`:** Continue to Step 2

---

## Step 2: Apply the Fix

### Option A: Quick Apply (Recommended)

1. Open **Supabase Dashboard → SQL Editor**
2. Copy the entire contents of `scripts/apply-function-security-fix.sql`
3. Paste into SQL Editor
4. Click **Run** or press `Ctrl+Enter`
5. You should see: `Success. No rows returned`

### Option B: Full Migration File

1. Open **Supabase Dashboard → SQL Editor**
2. Copy the entire contents of `prisma/migrations/fix_function_search_path.sql`
3. Paste into SQL Editor
4. Click **Run**

---

## Step 3: Verify the Fix

Run the verification query from Step 1 again. All functions should now show `✅ FIXED`.

---

## What This Fix Does

**Before:**
- Functions had mutable `search_path`
- Vulnerable to search path manipulation attacks
- Supabase Security Advisor warnings

**After:**
- Functions have `SET search_path = ''`
- Fixed search path prevents manipulation
- Security warnings resolved

**Functions Fixed:**
1. `public.tenant_id()` - Gets tenant ID from JWT
2. `public.user_id()` - Gets user ID from JWT  
3. `public.is_service_role()` - Checks if current role is service role
4. `public.create_tenant_policies()` - Creates RLS policies

---

## Troubleshooting

### Error: "function does not exist"
- The functions may not exist yet
- Run `prisma/migrations/enable_rls_complete.sql` first to create them

### Error: "permission denied"
- Ensure you're using the Supabase SQL Editor (has proper permissions)
- Don't run via psql or other clients unless you have superuser access

### Functions still show "NEEDS FIX"
- Check that the migration ran successfully
- Verify the function definitions include `SET search_path = ''`
- Try running the fix again (it's idempotent - safe to run multiple times)

---

## Additional Security Checks

### Verify RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('Contact', 'Invoice', 'Order', 'Employee')
ORDER BY tablename;
```

All should show `rowsecurity = true`

### Check RLS Policies

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Next Steps

After applying the fix:

1. ✅ Verify all functions show `✅ FIXED`
2. ✅ Check Supabase Security Advisor - warnings should be resolved
3. ✅ Test application functionality (functions should work as before)
4. ✅ Document the fix in your security audit log

---

**Reference Files:**
- `scripts/apply-function-security-fix.sql` - Quick apply script
- `prisma/migrations/fix_function_search_path.sql` - Full migration
- `SECURITY_FIX_SEARCH_PATH.md` - Detailed documentation
- `QUICK_SECURITY_FIX_GUIDE.md` - Quick reference

---

**Last Updated:** December 31, 2025

