# Migration Guide: Add ApiKey Model

## Overview

This guide helps you add the `ApiKey` model to your database schema and generate the Prisma client.

---

## Step 1: Generate Prisma Client

After the schema has been updated with the `ApiKey` model, generate the Prisma client:

```bash
npx prisma generate
```

This will create TypeScript types for the new `ApiKey` model.

---

## Step 2: Create Database Migration

Create and apply the database migration:

```bash
# Create migration
npx prisma migrate dev --name add_api_key_model

# Or if you prefer to push directly (development only)
npx prisma db push
```

**⚠️ For Production:**
- Use `prisma migrate deploy` instead of `prisma migrate dev`
- Or apply the migration manually via Supabase SQL Editor

---

## Step 3: Verify Migration

Check that the `ApiKey` table was created:

```sql
-- In Supabase SQL Editor
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'ApiKey'
ORDER BY ordinal_position;
```

You should see columns:
- `id` (text)
- `orgId` (text)
- `name` (text)
- `keyHash` (text)
- `scopes` (text array)
- `rateLimit` (integer)
- `ipWhitelist` (text array)
- `expiresAt` (timestamp)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

---

## Step 4: Verify Indexes

Check that indexes were created:

```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'ApiKey';
```

You should see indexes on:
- `orgId`
- `expiresAt`
- `orgId, expiresAt` (composite)

---

## Step 5: Test API Key Creation

Test that the API key service works:

```typescript
// In a test script or API route
import { generateAPIKey } from '@/lib/security/api-keys'

const result = await generateAPIKey({
  orgId: 'test-org-id',
  name: 'Test API Key',
  scopes: ['read:contacts', 'write:invoices'],
  rateLimit: 100,
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
})

console.log('API Key created:', result.id)
console.log('Key (show once):', result.key) // Save this!
```

---

## Troubleshooting

### Error: "Model ApiKey not found"
- Run `npx prisma generate` to regenerate the client
- Restart your development server

### Error: "Table ApiKey does not exist"
- Run `npx prisma migrate dev` or `npx prisma db push`
- Check that the migration was applied successfully

### Error: "Foreign key constraint fails"
- Ensure the `Tenant` table exists and has the `id` column
- Check that `orgId` values reference existing tenants

---

## Next Steps

After the migration is complete:

1. ✅ Test API key generation
2. ✅ Test API key validation
3. ✅ Integrate API key authentication in API routes
4. ✅ Document API key usage for your team

---

**Reference:**
- `lib/security/api-keys.ts` - API key service implementation
- `CYBERSECURITY_IMPLEMENTATION_STATUS.md` - Overall security status

---

**Last Updated:** December 31, 2025

