-- Quick Apply Script: Copy this entire file and run in Supabase SQL Editor
-- This applies the security fix for all 4 functions

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
  -- Service role bypasses RLS (used by Prisma)
  RETURN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
EXCEPTION
  WHEN OTHERS THEN
    -- If no JWT, assume service role (Prisma direct connection)
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

-- Verification: Run check-function-security-status.sql after this

