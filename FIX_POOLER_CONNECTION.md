# Fix Supabase Pooler Connection for Migrations

## Issue
Your current connection string uses the pooler but migrations are failing. For Supabase Session Pooler, we need to add the `pgbouncer=true` parameter.

## Current Connection String
```
postgresql://postgres.zjcutguakjavahdrytxc:x7RV7sVVfFvxApQ%408@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?schema=public
```

## Fixed Connection String for Migrations

Update your `.env` DATABASE_URL to:

```bash
DATABASE_URL="postgresql://postgres.zjcutguakjavahdrytxc:x7RV7sVVfFvxApQ%408@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&schema=public"
```

**Key change:** Added `pgbouncer=true` parameter

## Alternative: Use Transaction Pooler (Port 6543)

If Session Pooler still doesn't work, try Transaction Pooler:

```bash
DATABASE_URL="postgresql://postgres.zjcutguakjavahdrytxc:x7RV7sVVfFvxApQ%408@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
```

**Note:** Port 6543 is for Transaction Pooler

## Steps

1. Update `.env` with the corrected connection string (add `pgbouncer=true`)
2. Run migration:
   ```bash
   npx prisma migrate dev --name add_marketplace_reviews
   ```

## Why This Works

- Session Pooler (port 5432) supports migrations when `pgbouncer=true` is set
- Transaction Pooler (port 6543) is more restrictive but can work for simple migrations
- Both work on IPv4 networks without needing IPv4 add-on
