# 🌱 Seeding Production with Session Pooler (IPv4 Compatible)

## ✅ Use Session Pooler for Seeding

Since Direct Connection requires IPv6 (not available on all networks), use **Session Pooler** instead.

**Session Pooler Connection String:**
```
postgresql://postgres.ssbzexbhyifpafnvdaxn:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public
```

**Key Differences:**
- Port: `6543` (Session mode)
- Parameter: `?pgbouncer=true&schema=public`
- IPv4 compatible ✅

---

## 🚀 Run Seeder

**PowerShell:**
```powershell
cd "D:\Cursor Projects\PayAid V3"

# Extract password from existing pooler connection
$poolerUrl = (Get-Content .env.production | Select-String "DATABASE_URL").ToString() -replace 'DATABASE_URL=', '' -replace '"', '' -replace '\r\n', ''

# Extract password (between : and @)
if ($poolerUrl -match ':([^@]+)@') {
    $password = $matches[1]
    $sessionUrl = "postgresql://postgres.ssbzexbhyifpafnvdaxn:$password@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
    
    Write-Host "Using Session Pooler connection..."
    $env:DATABASE_URL = $sessionUrl
    
    # Run seeder
    npm run seed:demo-business
    
    # Validate
    npm run validate:demo-data
}
```

---

## ⚠️ Connection Pool Limits

Session Pooler still has connection limits. If you hit `MaxClientsInSessionMode`:

1. **Wait 5-10 minutes** for connections to clear
2. **Close all other DB connections** (dev servers, DB tools)
3. **Run during off-peak hours**
4. **Reduce batch sizes** in seed files (already set to 5)

---

## 🔄 Alternative: Manual Seeding via Supabase SQL Editor

If connection pooler keeps failing:

1. **Go to Supabase Dashboard** → SQL Editor
2. **Run this query** to check current demo tenant:
   ```sql
   SELECT id, name, subdomain FROM "Tenant" WHERE subdomain = 'demo';
   ```
3. **Note the tenant ID**, then run seeding queries manually (see seed files for SQL equivalents)

---

## ✅ Expected Results

After successful seeding:
- **CRM:** 150 contacts, 200 deals, 300 tasks, 500 activities, 100 meetings
- **Sales:** 400 orders, 350 invoices
- **Marketing:** 32 campaigns, 8 landing pages, 10 lead sources
- **Total:** ~1,950+ records
