# Supabase Migration Fix

## Issue
Prisma migrations fail with Supabase pooler connections because migrations require direct database connections.

## Solution

Supabase provides two connection types:
1. **Direct Connection** (port 5432) - Use for migrations
2. **Pooler Connection** (port 6543) - Use for application queries

### For Migrations:
Use the **Direct Connection** string from Supabase dashboard:
- Go to: Settings → Database → Connection string → Direct connection
- Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### For Application:
Keep using the **Pooler Connection** for your app (better for serverless/edge).

---

## Quick Fix

1. Get Direct Connection String from Supabase:
   - Dashboard → Settings → Database
   - Copy "Connection string" (Direct connection, not Pooler)
   - It should NOT have "pooler" in the hostname

2. Temporarily update `.env` for migration:
   ```bash
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

3. Run migration:
   ```bash
   npx prisma migrate dev --name add_marketplace_reviews
   ```

4. Switch back to pooler for app (optional, pooler works fine for queries):
   ```bash
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
   ```

---

## Alternative: Use Transaction Pooler

If you want to use pooler for migrations, try the transaction pooler (port 6543):

```bash
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

Note: Add `?pgbouncer=true` parameter for transaction pooler.

---

## Recommended Setup

Use **two different connection strings**:

### `.env` (for app - uses pooler):
```bash
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

### `.env.migration` (for migrations - uses direct):
```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

Then run migrations with:
```bash
dotenv -e .env.migration -- npx prisma migrate dev --name add_marketplace_reviews
```

Or temporarily swap the connection string in `.env` before running migrations.
