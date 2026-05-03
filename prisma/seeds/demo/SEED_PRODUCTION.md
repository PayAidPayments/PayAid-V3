# 🌱 Seeding Production Database (Vercel)

## ⚠️ Important: Connection Pooler Limits

The Supabase **Transaction Pooler** has connection limits. For seeding large amounts of data, use a **Direct Connection** instead.

---

## ✅ Step 1: Get Direct Connection String from Supabase

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Database Settings:**
   - Click **Settings** (gear icon) → **Database**

3. **Get Direct Connection String:**
   - Scroll to **Connection string** section
   - Select **URI** tab (NOT Connection Pooling)
   - Copy the connection string
   - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
   - **Add `?schema=public`** at the end

**Example Direct Connection:**
```
postgresql://postgres.ssbzexbhyifpafnvdaxn:YOUR_PASSWORD@db.ssbzexbhyifpafnvdaxn.supabase.co:5432/postgres?schema=public
```

**Key Differences from Pooler:**
- Host: `db.[PROJECT_REF].supabase.co` (not `pooler.supabase.com`)
- Port: `5432` (not `6543` or `5432` on pooler)
- No `?pgbouncer=true` parameter

---

## ✅ Step 2: Run Seeder with Direct Connection

**PowerShell:**
```powershell
cd "D:\Cursor Projects\PayAid V3"

# Replace with your DIRECT connection string (not pooler)
$env:DATABASE_URL = "postgresql://postgres.ssbzexbhyifpafnvdaxn:YOUR_PASSWORD@db.ssbzexbhyifpafnvdaxn.supabase.co:5432/postgres?schema=public"

# Run seeder
npm run seed:demo-business

# Validate
npm run validate:demo-data
```

**Bash/Linux/Mac:**
```bash
cd "D:\Cursor Projects\PayAid V3"

# Replace with your DIRECT connection string
export DATABASE_URL="postgresql://postgres.ssbzexbhyifpafnvdaxn:YOUR_PASSWORD@db.ssbzexbhyifpafnvdaxn.supabase.co:5432/postgres?schema=public"

# Run seeder
npm run seed:demo-business

# Validate
npm run validate:demo-data
```

---

## 🔄 Alternative: Run During Off-Peak Hours

If you must use the pooler connection:

1. **Wait for off-peak hours** (when fewer users are active)
2. **Close all other database connections** (stop dev servers, close DB tools)
3. **Run seeder:**
   ```powershell
   $env:DATABASE_URL = "<<YOUR_POOLER_CONNECTION>>"
   npm run seed:demo-business
   ```

---

## 🚀 Option 3: Create Vercel Serverless Function (Recommended for Future)

Create an admin-only API endpoint that runs seeding:

**File: `app/api/admin/seed-demo/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { seedDemoBusiness } from '@/prisma/seeds/demo/demo-business-master-seed'

export async function POST(request: NextRequest) {
  // Verify admin secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await seedDemoBusiness()
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

Then call it:
```bash
curl -X POST https://payaid-v3.vercel.app/api/admin/seed-demo \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

---

## ✅ Expected Results

After successful seeding:

- **CRM:** 150 contacts, 200 deals, 300 tasks, 500 activities, 100 meetings
- **Sales:** 400 orders, 350 invoices  
- **Marketing:** 32 campaigns, 8 landing pages, 10 lead sources
- **Total:** ~1,950+ records across Mar 2025 - Feb 2026

---

## 🐛 Troubleshooting

**Error: "MaxClientsInSessionMode"**
- ✅ Use **Direct Connection** (not pooler)
- ✅ Wait for connections to clear
- ✅ Close other database connections

**Error: "Column does not exist"**
- ✅ Run migrations first: `npx prisma migrate deploy`
- ✅ Regenerate Prisma client: `npx prisma generate`

**Error: "Connection timeout"**
- ✅ Check firewall/network
- ✅ Verify connection string is correct
- ✅ Try direct connection instead of pooler
