# Fix Login 500 Error

## Problem
The login API is returning a 500 error, likely due to a schema mismatch between Prisma client and the database.

## Solution

### Step 1: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 2: Push Schema to Database (if needed)
If the database is missing columns, run:
```bash
npx prisma db push
```

**Note:** Make sure you're in the project root directory (`D:\Cursor Projects\PayAid V3`)

### Step 3: Check Server Logs
Look at your dev server terminal to see the actual error. It will show something like:
- `Column "onboardingCompleted" does not exist`
- `Column "Tenant.onboardingCompleted" does not exist`

### Step 4: Alternative - Use Raw SQL to Add Missing Column
If `db:push` doesn't work, add the column manually:

```sql
ALTER TABLE "Tenant" 
ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN DEFAULT false;

ALTER TABLE "Tenant" 
ADD COLUMN IF NOT EXISTS "onboardingData" JSONB;
```

### Step 5: Restart Dev Server
After fixing the schema, restart your dev server:
```bash
npm run dev
```

## Quick Check
To verify the database has the required columns:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Tenant' 
AND column_name IN ('onboardingCompleted', 'onboardingData');
```

