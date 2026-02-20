# Database Migration Guide - Merchant Onboarding & KYC Documents

## Issue
The Prisma migration command is failing due to a database connection error: `FATAL: Tenant or user not found`

## Solution Options

### Option 1: Fix Database Connection (Recommended)

1. **Check your `.env` file** and verify the `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   ```

2. **Verify database credentials**:
   - Ensure the database user exists
   - Ensure the database exists
   - Check if the connection string uses the correct format

3. **For Supabase** (based on your connection string):
   - Use the **direct connection** URL instead of the pooler URL for migrations
   - Format: `postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres`
   - Or use the connection pooler with proper credentials

4. **Test connection**:
   ```bash
   npx prisma db pull
   ```

### Option 2: Run Manual SQL Migration

If you can't fix the connection immediately, you can run the SQL migration directly:

1. **Connect to your database** using your preferred SQL client (pgAdmin, DBeaver, Supabase SQL Editor, etc.)

2. **Run the SQL file**:
   ```bash
   # The SQL file is located at:
   prisma/migrations/manual_add_merchant_onboarding_kyc_documents.sql
   ```

3. **Or copy-paste the SQL** from the file into your SQL editor and execute it

4. **Mark migration as applied** (optional):
   ```bash
   # After running the SQL manually, create a migration record:
   mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_add_merchant_onboarding_kyc_documents
   echo "-- Migration applied manually" > prisma/migrations/$(date +%Y%m%d%H%M%S)_add_merchant_onboarding_kyc_documents/migration.sql
   ```

### Option 3: Use Prisma Studio to Verify

After running the migration (either way), verify the tables were created:

```bash
npx prisma studio
```

You should see:
- `MerchantOnboarding` table
- `KYCDocument` table

## Migration Details

### Tables Created:

1. **MerchantOnboarding**
   - Tracks onboarding status and workflow
   - Linked to Tenant via `tenantId`
   - Fields: status, kycStatus, riskScore, documents (JSON), review info

2. **KYCDocument**
   - Stores uploaded KYC documents
   - Linked to Tenant and MerchantOnboarding
   - Fields: documentType, fileUrl, verificationStatus, OCR data

### Indexes Created:
- Status indexes for filtering
- Foreign key indexes for performance
- Tenant ID indexes for queries

## Verification

After migration, verify the tables exist:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('MerchantOnboarding', 'KYCDocument');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('MerchantOnboarding', 'KYCDocument');
```

## Next Steps

Once the migration is complete:

1. ✅ Tables created
2. ✅ Run `npx prisma generate` to update Prisma Client
3. ✅ Test the API endpoints
4. ✅ Test the UI pages

## Troubleshooting

### If tables already exist:
The SQL uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### If foreign key errors occur:
Ensure the `Tenant` table exists and has the `id` column.

### If you need to rollback:
```sql
DROP TABLE IF EXISTS "KYCDocument";
DROP TABLE IF EXISTS "MerchantOnboarding";
```

---

**Note**: The manual SQL migration file is located at:
`prisma/migrations/manual_add_merchant_onboarding_kyc_documents.sql`
