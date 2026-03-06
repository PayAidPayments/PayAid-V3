# Manual Tenant Slug Migration (when Prisma/script can't connect)

If you get **"FATAL: Tenant or user not found"** from Prisma or the backfill script but your `DATABASE_URL` is correct, use the SQL file instead.

## Option A: Run SQL in Supabase Dashboard (recommended)

1. Open **Supabase Dashboard** → your project → **SQL Editor**.
2. Open `prisma/migrations/manual_add_tenant_slug_and_backfill.sql` in your repo.
3. Copy the **entire** file contents into a new query in the SQL Editor.
4. Click **Run**.
5. This will:
   - Add the `slug` column to `Tenant` if it doesn’t exist.
   - Create the unique index on `slug`.
   - Backfill slugs for all tenants that have `slug` NULL (derived from name + id hash).

No Prisma or app connection needed; the dashboard uses the project’s own credentials.

## Option B: Fix the connection, then use Prisma/script

If you prefer to fix the connection and use Prisma/backfill script:

1. **Use the right connection string**
   - In Supabase: **Settings → Database**.
   - For Prisma and Node scripts, use **Connection string → URI** and choose:
     - **Session mode** (port 5432), or  
     - **Transaction mode** (port 6543) if you use pooling.
   - Replace `[YOUR-PASSWORD]` with the actual database password (not the anon key).

2. **Pooler vs direct**
   - If you use **Supabase Pooler** (e.g. `pooler.supabase.com`), the password is still the **database** password.
   - “Tenant or user not found” often means the **user** in the URL is wrong (e.g. use `postgres.[project-ref]` for pooler, not just `postgres`), or the project is paused.

3. **Project status**
   - In Supabase Dashboard, check that the project is **Active** (not paused). Paused projects reject connections.

4. **IPv4**
   - Some networks block port 5432. Try from another network or use Supabase’s **Connection pooling** with port **6543**.

5. **.env**
   - Ensure `.env` in the project root has:
     ```env
     DATABASE_URL="postgresql://postgres.[ref]:YOUR_DB_PASSWORD@aws-0-xx.pooler.supabase.com:6543/postgres?pgbouncer=true"
     ```
   - No spaces around `=`, password URL-encoded if it has special characters.

After the DB connects, run:

```bash
npx prisma migrate deploy
npx tsx scripts/backfill-tenant-slugs.ts
```

Or use the manual SQL file once and skip the script.
