# Row Level Security (RLS) Implementation Guide

## ⚠️ Security Risk Assessment

**Current Status:** RLS is disabled on all tables in the `public` schema.

**Risk Level:** **HIGH** if PostgREST is enabled (which Supabase enables by default)

### Why This Matters

1. **PostgREST Exposure:** Supabase automatically exposes your database via PostgREST REST API
2. **Direct Database Access:** Without RLS, anyone with database credentials can access all tenant data
3. **Defense in Depth:** Even with application-level security, RLS adds an extra security layer
4. **Compliance:** Many regulations (GDPR, SOC 2) require database-level access controls

### Your Current Setup

✅ **Application-Level Security:**
- JWT token verification
- Tenant isolation in application code
- Prisma ORM for database access

⚠️ **Missing:**
- Database-level security (RLS)
- Protection against direct database access
- Protection if PostgREST is accidentally exposed

---

## 🔧 Solution Options

### Option 1: Disable PostgREST (Simplest)

If you're **NOT** using Supabase's PostgREST API:

1. Go to Supabase Dashboard
2. Settings → API
3. Disable PostgREST
4. RLS warnings will disappear (but RLS is still recommended)

**Pros:**
- Quick fix
- No code changes needed
- Eliminates PostgREST exposure risk

**Cons:**
- No defense-in-depth
- If PostgREST is re-enabled, you're vulnerable again

---

### Option 2: Enable RLS with Policies (Recommended)

Enable RLS and create tenant isolation policies.

**Pros:**
- Defense-in-depth security
- Protects against direct database access
- Complies with security best practices
- Works even if PostgREST is enabled

**Cons:**
- Requires policy configuration
- Need to ensure Prisma uses service role

---

## 📋 Implementation Steps

### Step 1: Enable RLS on All Tables

Run the SQL migration:

```bash
# Via Supabase SQL Editor or psql
psql $DATABASE_URL < prisma/migrations/enable_rls.sql
```

Or manually in Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `prisma/migrations/enable_rls.sql`
3. Execute

### Step 2: Create Helper Functions

The migration includes helper functions:
- `auth.tenant_id()` - Gets tenant_id from JWT
- `auth.user_id()` - Gets user_id from JWT
- `auth.is_service_role()` - Checks if current role is service_role

### Step 3: Create RLS Policies

For tenant-scoped tables, policies ensure:
- Users can only access data from their tenant
- Service role (Prisma) can access all data
- Regular users are restricted to their tenant

### Step 4: Configure Prisma to Use Service Role

Ensure Prisma uses service role JWT when connecting:

```typescript
// In lib/db/prisma.ts
// Prisma automatically uses service role when connecting via connection string
// No changes needed if using direct connection
```

---

## 🔐 RLS Policy Strategy

### For Tenant-Scoped Tables

**Policy Pattern:**
```sql
-- Allow service role (Prisma) full access
-- Restrict regular users to their tenant
CREATE POLICY "table_select_tenant"
  ON "Table"
  FOR SELECT
  USING (
    auth.is_service_role()
    OR "tenantId" = auth.tenant_id()::text
  );
```

### For Shared Tables

**Example: ModuleDefinition (shared across tenants)**
```sql
-- Allow all authenticated users to read
CREATE POLICY "ModuleDefinition_select_all"
  ON "ModuleDefinition"
  FOR SELECT
  USING (auth.user_id() IS NOT NULL);
```

### For NewsItem (Mixed)

**Example: NewsItem (tenant-specific + general)**
```sql
-- Allow users to see their tenant's news + general news
CREATE POLICY "NewsItem_select_tenant_or_general"
  ON "NewsItem"
  FOR SELECT
  USING (
    auth.is_service_role()
    OR "tenantId" = auth.tenant_id()::text
    OR "tenantId" IS NULL  -- General news
  );
```

---

## 🧪 Testing RLS

### Test 1: Verify RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

### Test 2: Verify Policies Exist

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Test 3: Test Tenant Isolation

```sql
-- Set tenant context (simulate user JWT)
SET request.jwt.claims = '{"tenant_id": "test-tenant-id", "sub": "user-id"}';

-- Try to access data from different tenant (should fail)
SELECT * FROM "Contact" WHERE "tenantId" != 'test-tenant-id';
```

---

## ⚙️ Configuration for Prisma

### Service Role Access

Prisma needs to bypass RLS for application queries. Options:

**Option A: Use Service Role JWT (Recommended)**
```typescript
// In lib/db/prisma.ts
// Add service role JWT to connection string
const serviceRoleJwt = process.env.SUPABASE_SERVICE_ROLE_JWT
const databaseUrl = process.env.DATABASE_URL

// If using Supabase client, set service role
// For Prisma, service role is implicit via connection string
```

**Option B: Grant Service Role Bypass**
```sql
-- Grant service role permission to bypass RLS
GRANT BYPASS RLS TO service_role;
```

---

## 📊 Current Status

**Tables Requiring RLS:** ~200+ tables

**Priority Tables (High Risk):**
- `User` - User data
- `Tenant` - Tenant information
- `Contact` - Customer data
- `Invoice` - Financial data
- `Employee` - HR data
- `Order` - Sales data
- All tables with `tenantId` column

---

## 🚀 Quick Start

1. **Review the migration:**
   ```bash
   cat prisma/migrations/enable_rls.sql
   ```

2. **Apply RLS enablement:**
   - Via Supabase SQL Editor (recommended)
   - Or via `psql $DATABASE_URL < prisma/migrations/enable_rls.sql`

3. **Generate policies:**
   ```bash
   npm run ts-node scripts/enable-rls-policies.ts
   ```

4. **Apply policies:**
   - Review generated policies
   - Apply via Supabase SQL Editor

5. **Test:**
   - Verify RLS is enabled
   - Test tenant isolation
   - Verify Prisma still works

---

## ⚠️ Important Notes

1. **Prisma Compatibility:**
   - Prisma uses service role, so it bypasses RLS
   - Your application-level security still applies
   - RLS adds defense-in-depth

2. **PostgREST:**
   - If using PostgREST, ensure JWT includes `tenant_id`
   - Service role JWT bypasses RLS
   - Regular user JWTs are restricted by RLS

3. **Performance:**
   - RLS policies add minimal overhead
   - Indexes on `tenantId` help performance
   - Policies are evaluated per query

4. **Migration Safety:**
   - RLS can be enabled without breaking existing queries
   - Policies can be added incrementally
   - Test in development first

---

## 📚 Resources

- [Supabase RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)

---

## ✅ Next Steps

1. ✅ Review this document
2. ⬜ Decide: Disable PostgREST OR Enable RLS
3. ⬜ Apply RLS enablement migration
4. ⬜ Generate and review policies
5. ⬜ Apply policies
6. ⬜ Test tenant isolation
7. ⬜ Verify Prisma still works
8. ⬜ Deploy to production

---

**Status:** Ready for implementation
**Priority:** High (Security)
**Estimated Time:** 1-2 hours

