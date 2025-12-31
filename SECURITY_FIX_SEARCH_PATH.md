# Security Fix: Function Search Path Warnings

## Issue
Supabase Security Advisor detected 4 functions with mutable `search_path` parameters, which is a security vulnerability. These functions are:
- `public.tenant_id()`
- `public.user_id()`
- `public.is_service_role()`
- `public.create_tenant_policies()`

## Risk
Functions without a fixed `search_path` are vulnerable to search path manipulation attacks, where an attacker could manipulate the search path to make functions reference objects in unexpected schemas.

## Solution
Add `SET search_path = ''` to all affected functions to ensure they always use a fixed search path.

## How to Apply the Fix

### Option 1: Run the Migration File (Recommended)

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `prisma/migrations/fix_function_search_path.sql`
3. Execute the SQL script

### Option 2: Manual Fix via SQL Editor

Run the following SQL in Supabase SQL Editor:

```sql
-- Fix tenant_id() function
CREATE OR REPLACE FUNCTION public.tenant_id()
RETURNS TEXT 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'tenant_id';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Fix user_id() function
CREATE OR REPLACE FUNCTION public.user_id()
RETURNS TEXT 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'sub';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Fix is_service_role() function
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
EXCEPTION
  WHEN OTHERS THEN
    RETURN TRUE;
END;
$$;

-- Fix create_tenant_policies() function
CREATE OR REPLACE FUNCTION public.create_tenant_policies(table_name TEXT)
RETURNS VOID 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Drop existing policies if they exist
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', table_name || '_select', table_name);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', table_name || '_insert', table_name);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', table_name || '_update', table_name);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', table_name || '_delete', table_name);

  -- Create SELECT policy
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR SELECT
    USING (
      public.is_service_role()
      OR "tenantId" = public.tenant_id()::text
      OR EXISTS (
        SELECT 1 FROM "TenantMember" tm
        WHERE tm."tenantId" = %I."tenantId"
        AND tm."userId" = public.user_id()::text
      )
    )',
    table_name || '_select',
    table_name,
    table_name
  );

  -- Create INSERT policy
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR INSERT
    WITH CHECK (
      public.is_service_role()
      OR "tenantId" = public.tenant_id()::text
    )',
    table_name || '_insert',
    table_name
  );

  -- Create UPDATE policy
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR UPDATE
    USING (
      public.is_service_role()
      OR "tenantId" = public.tenant_id()::text
    )',
    table_name || '_update',
    table_name
  );

  -- Create DELETE policy
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR DELETE
    USING (
      public.is_service_role()
      OR "tenantId" = public.tenant_id()::text
    )',
    table_name || '_delete',
    table_name
  );
END;
$$;
```

## Verification

After applying the fix, verify that the functions have the fixed search_path:

```sql
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('tenant_id', 'user_id', 'is_service_role', 'create_tenant_policies')
ORDER BY p.proname;
```

Each function definition should include `SET search_path = ''`.

## What Changed

- **Before**: Functions had mutable `search_path`, making them vulnerable to manipulation
- **After**: Functions have `SET search_path = ''`, ensuring they always use a fixed (empty) search path

## Impact

- ✅ **No breaking changes**: Function signatures and behavior remain the same
- ✅ **Security improvement**: Functions are now protected against search path manipulation
- ✅ **No application changes needed**: The fix is purely at the database level

## Files Updated

- `prisma/migrations/fix_function_search_path.sql` - New migration file with the fix
- `prisma/migrations/enable_rls_complete.sql` - Updated with fixed search_path

## Next Steps

1. Apply the migration in Supabase SQL Editor
2. Verify the fix using the verification query above
3. Check Supabase Security Advisor - warnings should be resolved

