# Verify Supabase Connection String

## Current Issue
Getting "Tenant or user not found" error, which suggests authentication problem.

## Steps to Fix

### 1. Get Correct Connection String from Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to: **Settings → Database**
3. Under **Connection string**, select **Session Pooler** (not Direct)
4. Copy the connection string - it should look like:

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

### 2. Important Notes

- **Password**: Make sure you're using the database password, NOT the project password
- **URL Encoding**: If your password contains special characters like `@`, they need to be URL-encoded:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - etc.

### 3. Test Connection

You can test the connection string format:

```bash
# Test with psql (if installed)
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true"
```

### 4. Update .env

Once you have the correct connection string from Supabase dashboard:

1. Copy it exactly as shown
2. Add `?pgbouncer=true&schema=public` at the end if not present
3. Update `.env` file
4. Try migration again

### 5. Alternative: Use Supabase SQL Editor

If migrations continue to fail, you can run the SQL manually:

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `MIGRATION_GUIDE.md` manually
3. This will create the tables without using Prisma migrations

---

## Connection String Format Reference

### Session Pooler (Port 5432) - Recommended for migrations
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&schema=public
```

### Transaction Pooler (Port 6543) - Alternative
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public
```

**Note:** Replace `[PROJECT-REF]` with your actual project reference (e.g., `zjcutguakjavahdrytxc`)

---

## Quick Check

Verify your connection string has:
- ✅ `postgres.[PROJECT-REF]` format (not just `postgres`)
- ✅ Correct password (database password from Supabase)
- ✅ `pgbouncer=true` parameter
- ✅ `schema=public` parameter
- ✅ Port 5432 (Session Pooler) or 6543 (Transaction Pooler)
