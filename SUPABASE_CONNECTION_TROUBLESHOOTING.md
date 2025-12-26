# Supabase Connection Troubleshooting

## ✅ Project Status: ACTIVE
- Project is confirmed active in Supabase Dashboard
- Database shows 0 tables (ready for schema push)

## ❌ Current Issue: ENOTFOUND

**Error:** `getaddrinfo ENOTFOUND db.zjcutguakjavahdrytxc.supabase.co`

**DNS Resolution:** 
- ✅ DNS resolves to IPv6: `2406:da12:b78:de0a:9d4e:6fc4:eaf4:a2cd`
- ⚠️ Node.js/Prisma may have issues with IPv6-only connections

## 🔧 Solutions to Try

### Solution 1: Use Connection Pooling URL (Recommended)

Supabase provides connection pooling URLs that are more reliable:

1. **Go to Supabase Dashboard:**
   - Settings → Database → Connection Pooling

2. **Copy Transaction Mode Connection String:**
   - Format: `postgresql://postgres.zjcutguakjavahdrytxc:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
   - Uses port **6543** instead of 5432
   - Better for serverless/edge functions
   - More reliable connection

3. **Update `.env`:**
   ```env
   DATABASE_URL="postgresql://postgres.zjcutguakjavahdrytxc:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?schema=public"
   ```

### Solution 2: Check Supabase Database Settings

1. **Go to:** Settings → Database
2. **Check Connection Pooling:**
   - Ensure it's enabled
   - Copy the connection string from there
3. **Check IP Restrictions:**
   - Settings → Database → Connection Pooling → Allowed IPs
   - Ensure your IP is allowed (or set to allow all)

### Solution 3: Use Direct Connection with IPv4

If your network doesn't support IPv6 properly:

1. **Get IPv4 address** from Supabase dashboard
2. **Or use connection pooling** (which uses IPv4)

### Solution 4: Test from Supabase SQL Editor

1. Go to SQL Editor in Supabase Dashboard
2. Run: `SELECT version();`
3. If this works, database is accessible
4. Issue is with external connection (network/firewall)

## 📋 Steps to Get Connection Pooling URL

1. **Supabase Dashboard** → Your Project
2. **Settings** (gear icon) → **Database**
3. Scroll to **Connection Pooling** section
4. Find **Transaction** mode
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your actual password from Supabase Dashboard
7. If password contains `@`, URL-encode it as `%40`
8. Add `?schema=public` at the end

**Expected format:**
```
postgresql://postgres.zjcutguakjavahdrytxc:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?schema=public
```

## 🔍 Network Diagnostics

**DNS Resolution:**
```bash
nslookup db.zjcutguakjavahdrytxc.supabase.co
# Returns IPv6 address (may cause connection issues)
```

**Port Test:**
```bash
Test-NetConnection -ComputerName db.zjcutguakjavahdrytxc.supabase.co -Port 5432
```

## ✅ Next Steps

1. **Try Connection Pooling URL** (most likely to work)
2. **Check Supabase IP Restrictions** in settings
3. **Test SQL Editor** in dashboard (verify database works)
4. **If still failing:** Check Windows Firewall/Antivirus blocking port 5432

---

**Current Status:** Project active, DNS resolves to IPv6, connection failing - likely network/IPv6 issue.

**Recommended Action:** Use Connection Pooling URL from Supabase Dashboard.
