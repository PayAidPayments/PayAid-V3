# Step 3: Supabase + Multi-Tenant (RLS & Alignment)

## What’s in this step

1. **RLS (Row Level Security)** – SQL migration to isolate tenant data in Supabase/Postgres.
2. **JWT `tenant_id`** – How to set it so RLS works when using Supabase client.
3. **Schema alignment** – Shell and **packages/db** as single source of truth; forks (EspoCRM, Bigcapital) stay on their own DBs for now; tenant is passed via URL.

---

## 1. Apply the RLS migration

**File:** `supabase/migrations/20250315000000_add_rls_tenant_isolation.sql`

- Enables RLS on all tenant-scoped tables (Tenant, User, Session, CrmLead, Invoice, etc.).
- Adds one policy per table: `USING ("tenantId" = (JWT claim 'tenant_id'))`.
- **Tenant** and **User**/**Session**: allow `tenant_id` NULL in JWT for SuperAdmin (see migration comments).

**How to run:**

- **Option A – Supabase Dashboard**  
  Supabase → SQL Editor → paste the contents of the migration file → Run.

- **Option B – Supabase CLI**  
  From repo root:
  ```bash
  npx supabase db push
  ```
  or
  ```bash
  npx supabase migration up
  ```
  (Requires Supabase project linked.)

After this, any connection that uses a JWT with `tenant_id` (and does not use a bypass role) will only see rows for that tenant.

---

## 2. JWT claim `tenant_id`

RLS reads the **`tenant_id`** claim from the JWT (e.g. from `request.jwt.claims` in Postgres).

### When using Supabase Auth

- Set **`app_metadata.tenant_id`** (or a custom claim) when creating/signing the JWT (e.g. on login).
- Supabase Auth can pass `app_metadata` into the JWT; then use the same JWT when calling Supabase client so RLS sees it.

### When using the PayAid shell (cookie JWT)

- The shell uses **cookie-based JWT** (jose) with `tenantId` in the payload (see `apps/web/lib/auth.ts`).
- That JWT is **not** sent to Supabase by default. So:
  - **Server-side (Prisma):** The shell uses Prisma with `DATABASE_URL`. If that URL uses a **role that bypasses RLS** (e.g. `postgres` or Supabase “service” role), RLS does not apply; tenant isolation is done in app code (e.g. `where: { tenantId }`). This is the current pattern.
  - **Client-side (Supabase client):** If you add Supabase client in the browser and want RLS to apply, you must either:
    - Sign a **Supabase-compatible JWT** that includes `tenant_id` (and optionally `role`) from your login API and set it as the Supabase session, or
    - Use Supabase Auth and set `app_metadata.tenant_id` on the user so the Supabase JWT contains it.

So: **RLS is for Supabase client usage.** In Postgres, the **table owner** (e.g. the role that ran migrations) bypasses RLS. So the shell’s Prisma connection (e.g. `DATABASE_URL` with the same role) continues to work and can keep enforcing tenant in app code; RLS applies when using Supabase API/client with a JWT (e.g. anon/authenticated role).

---

## 3. Schema alignment and forks

- **packages/db** (Prisma) is the **single source of truth** for:
  - Tenants (table **Tenant**).
  - Users, CRM entities, invoices, etc., all with **tenantId** (and indexes).
- **Shell (apps/web):** Reads/writes via Prisma; enforces tenant from session/URL (e.g. `getTenantContext(slug)`).
- **EspoCRM (apps/payaid-crm):** Has its own DB (e.g. MariaDB in Docker). Tenant is passed in the iframe URL (`?tenant=...&slug=...`). No shared schema yet; later you can add tenant_id to EspoCRM tables or sync from **packages/db**.
- **Bigcapital (apps/payaid-finance):** Has its own DB (MySQL/Mongo etc.). Same idea: tenant from URL; shared schema alignment later if you want a single DB.

So **“use that schema (or align)”** today means: shell and any service using **packages/db** use the same Tenant + tenantId model; forks use their own DBs and receive tenant context via URL (and optionally future API with tenant header).

---

## 4. Optional: Redis and speed

- **Redis:** For session cache or rate limiting, set **`REDIS_URL`** in the shell (e.g. `apps/web/.env`). No change required in the RLS migration.
- **Indexes:** **packages/db** already has indexes on `tenantId` and composite keys (e.g. `tenantId + status`). Keep them for fast tenant-scoped queries.

---

## 5. Checklist (Step 3)

- [ ] Run `supabase/migrations/20250315000000_add_rls_tenant_isolation.sql` in Supabase (SQL Editor or `supabase migration up`).
- [ ] If you use Supabase client with RLS: ensure JWT includes `tenant_id` (e.g. from login / app_metadata).
- [ ] Shell continues to enforce tenant in app code when using Prisma; optional: use a DB role that bypasses RLS for that connection.
- [ ] (Optional) Set `REDIS_URL` in the shell for cache/sessions.
