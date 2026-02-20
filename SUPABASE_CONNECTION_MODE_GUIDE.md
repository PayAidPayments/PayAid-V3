# Supabase Connection Modes - Complete Guide ✅

## Understanding Supabase Connection Types

Supabase offers **3 different connection modes**, each with different ports:

### 1. Direct Connection (Port 5432) ❌
- **Port:** `5432`
- **Use Case:** Migrations, direct database access
- **Limits:** Very strict (1-2 connections)
- **NOT Recommended** for application use

### 2. Session Pooler (Port 5432) ❌
- **Port:** `5432`
- **Use Case:** Long-running connections
- **Limits:** Strict (1-5 connections per user)
- **NOT Recommended** for serverless/concurrent requests
- **Causes:** "MaxClientsInSessionMode" errors

### 3. Transaction Pooler (Port 6543) ✅ **USE THIS**
- **Port:** `6543`
- **Use Case:** Serverless, concurrent requests, production
- **Limits:** Higher (10+ connections)
- **Recommended** for all application use
- **Requires:** `?pgbouncer=true` parameter

## How to Get Transaction Pooler Connection String

### Step 1: Go to Supabase Dashboard
1. Visit [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project

### Step 2: Navigate to Database Settings
1. Click **Project Settings** (gear icon)
2. Click **Database** in the left sidebar
3. Scroll to **Connection String** section

### Step 3: Select Transaction Mode
1. You'll see **3 connection modes:**
   - **Direct Connection** (port 5432) ❌
   - **Session Pooler** (port 5432) ❌
   - **Transaction Pooler** (port 6543) ✅ **SELECT THIS**

2. Click on **Transaction Pooler** tab
3. Copy the connection string

### Step 4: Connection String Format

The Transaction Pooler connection string should look like:

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Example:**
```
postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Key Requirements:**
- ✅ Hostname: `pooler.supabase.com` (not `db.xxxxx.supabase.co`)
- ✅ Port: `6543` (not `5432`)
- ✅ Parameter: `?pgbouncer=true` (required for transaction mode)

## Update .env.local

Replace your DATABASE_URL with the **Transaction Pooler** connection string:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Important:**
- Replace `[YOUR-PASSWORD]` with your actual database password
- Keep the `?pgbouncer=true` parameter
- Ensure port is `6543`

## Verify Connection String

### Check 1: Port Number
```bash
# Windows PowerShell
$env:DATABASE_URL | Select-String ":6543"

# Should show: :6543
```

### Check 2: Pooler Hostname
```bash
# Windows PowerShell
$env:DATABASE_URL | Select-String "pooler.supabase.com"

# Should show: pooler.supabase.com
```

### Check 3: pgbouncer Parameter
```bash
# Windows PowerShell
$env:DATABASE_URL | Select-String "pgbouncer=true"

# Should show: pgbouncer=true
```

## After Updating

### Step 1: Restart Development Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 2: Check Terminal Logs

You should see:
```
[PRISMA] DATABASE_URL detected: { originalPort: '6543', hasPooler: true, ... }
[PRISMA] Switched Supabase pooler to transaction mode (port 6543)
[PRISMA] Connection limit set to 10 (transaction mode, localhost)
```

### Step 3: Test Dashboard

1. Open `http://localhost:3000`
2. Log in
3. Navigate to CRM Dashboard
4. Should load without connection errors ✅

## Why Transaction Pooler?

**Session Pooler (port 5432):**
- ❌ Strict connection limits (1-5 per user)
- ❌ Causes "MaxClientsInSessionMode" errors
- ❌ Not suitable for concurrent requests

**Transaction Pooler (port 6543):**
- ✅ Higher connection limits (10+)
- ✅ Handles concurrent requests better
- ✅ Recommended for production and development
- ✅ Works with serverless architectures

## Troubleshooting

### Issue: Still Getting Pool Exhaustion

**Check:**
1. Is DATABASE_URL using port `6543`? (not `5432`)
2. Does hostname include `pooler.supabase.com`?
3. Does it include `?pgbouncer=true`?
4. Did you restart the server after updating `.env.local`?

### Issue: Wrong Connection String

**Symptoms:**
- Hostname is `db.xxxxx.supabase.co` (not `pooler.supabase.com`)
- Port is `5432` (not `6543`)
- No `pgbouncer=true` parameter

**Solution:** Get Transaction Pooler connection string from Supabase Dashboard

## Quick Reference

| Connection Type | Port | Use Case | Recommended? |
|----------------|------|----------|--------------|
| Direct Connection | 5432 | Migrations | ❌ No |
| Session Pooler | 5432 | Long-running | ❌ No |
| **Transaction Pooler** | **6543** | **Application** | **✅ Yes** |

## Expected Result

After using Transaction Pooler (port 6543):
- ✅ No more "connection pool exhausted" errors
- ✅ Dashboard loads successfully
- ✅ Multiple concurrent requests work
- ✅ Connection limit is 10 (for localhost)

**Always use Transaction Pooler (port 6543) for your application!**
