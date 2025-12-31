# Quick Guide: Fix Function Search Path Security Warnings

## 🔍 Step 1: Check Current Status

Run this query in **Supabase SQL Editor**:

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

**Expected Output:**
- If all show `✅ FIXED` → You're done! ✅
- If any show `❌ NEEDS FIX` → Continue to Step 2

---

## 🔧 Step 2: Apply the Fix

### Option A: Use the Quick Apply Script (Recommended)

1. Open **Supabase Dashboard → SQL Editor**
2. Copy the entire contents of `scripts/apply-function-security-fix.sql`
3. Paste and execute in SQL Editor
4. You should see: `Success. No rows returned`

### Option B: Use the Full Migration File

1. Open **Supabase Dashboard → SQL Editor**
2. Copy the entire contents of `prisma/migrations/fix_function_search_path.sql`
3. Paste and execute in SQL Editor

---

## ✅ Step 3: Verify the Fix

Run the status check query again (from Step 1). All functions should now show `✅ FIXED`.

---

## 📋 What This Fix Does

- **Before:** Functions had mutable `search_path`, making them vulnerable to search path manipulation attacks
- **After:** Functions have `SET search_path = ''`, ensuring they always use a fixed (empty) search path

**Functions Fixed:**
1. `public.tenant_id()` - Gets tenant ID from JWT
2. `public.user_id()` - Gets user ID from JWT
3. `public.is_service_role()` - Checks if current role is service role
4. `public.create_tenant_policies()` - Creates RLS policies for tenant isolation

---

## 🎯 Result

After applying the fix, Supabase Security Advisor warnings for these 4 functions will be resolved.

---

**Need Help?** See `SECURITY_FIX_SEARCH_PATH.md` for detailed documentation.

