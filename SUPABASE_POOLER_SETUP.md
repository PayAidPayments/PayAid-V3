# Supabase Connection Pooler Setup

## ✅ Issue Identified

**Problem:** Direct connection fails with `ENOTFOUND` error
- Free Plan only supports IPv6 for direct connections
- Your network/client can't resolve IPv6 addresses
- IPv4 add-on costs $4/month and is unavailable on Free Plan

**Solution:** Use **Shared Connection Pooler** (Free, IPv4-compatible)

---

## 🔧 Steps to Get Connection Pooler URL

### Option 1: From Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/zjcutguakjavahdrytxc

2. **Navigate to Database Settings:**
   - Click **Settings** (gear icon) → **Database**
   - Scroll down to **Connection Pooling** section

3. **Copy Connection String:**
   - Look for **Session** or **Transaction** mode
   - Copy the connection string (URI format)
   - It will look like:
     ```
     postgresql://postgres.zjcutguakjavahdrytxc:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
     ```

### Option 2: Construct It Manually

Based on your project details:
- **Project Reference:** `zjcutguakjavahdrytxc`
- **Password:** `[YOUR-PASSWORD]` (get from Supabase Dashboard)
- **Region:** ap-south-1 (likely, based on your location)

**Format:**
```
postgresql://postgres.zjcutguakjavahdrytxc:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?schema=public
```

**Note:** 
- Username format: `postgres.PROJECT_REF` (not just `postgres`)
- Port: `6543` (not `5432`)
- Host: `pooler.supabase.com` (not `db.PROJECT_REF.supabase.co`)
- Password `@` must be URL-encoded as `%40`

---

## 📝 Update .env File

Once you have the pooler connection string:

```env
# Replace the direct connection with pooler connection
DATABASE_URL="postgresql://postgres.zjcutguakjavahdrytxc:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?schema=public"
```

**Key Differences:**
- ✅ Uses port **6543** (pooler) instead of **5432** (direct)
- ✅ Uses `pooler.supabase.com` hostname (IPv4-compatible)
- ✅ Username is `postgres.zjcutguakjavahdrytxc` (with project ref)
- ✅ Free to use on Free Plan

---

## ✅ Test Connection

After updating `.env`:

```bash
npx prisma db push
```

This should now work! The pooler resolves to IPv4 addresses.

---

## 🔍 Verify Pooler Settings

In Supabase Dashboard → Settings → Database → Connection Pooling:

1. **Check Pooler Status:** Should be enabled
2. **Connection Mode:** 
   - **Session mode** - For long-lived connections (better for Prisma)
   - **Transaction mode** - For serverless/edge functions
3. **Port:** 6543 (default)

---

## 📊 Connection Pooler vs Direct Connection

| Feature | Direct Connection | Connection Pooler |
|---------|------------------|-------------------|
| **IPv4 Support** | ❌ (Free Plan) | ✅ Free |
| **IPv6 Support** | ✅ | ✅ |
| **Port** | 5432 | 6543 |
| **Hostname** | `db.PROJECT.supabase.co` | `pooler.supabase.com` |
| **Username** | `postgres` | `postgres.PROJECT_REF` |
| **Cost** | Free (IPv6 only) | Free |
| **Best For** | IPv6 networks | IPv4 networks, serverless |

---

## 🆘 Troubleshooting

### Still Getting Connection Errors?

1. **Verify Pooler is Enabled:**
   - Check Supabase Dashboard → Settings → Database
   - Ensure Connection Pooling is enabled

2. **Check Region:**
   - Your pooler URL might use a different region
   - Common regions: `aws-0-ap-south-1`, `aws-0-us-east-1`, etc.
   - Get the exact URL from Supabase dashboard

3. **Test with SQL Editor:**
   - Go to SQL Editor in Supabase Dashboard
   - Run: `SELECT version();`
   - If this works, database is accessible

4. **Verify Password Encoding:**
   - Password `@` must be `%40` in connection string
   - No spaces or extra characters

---

## ✅ Success Checklist

- [ ] Got connection pooler URL from Supabase Dashboard
- [ ] Updated `DATABASE_URL` in `.env` with pooler URL
- [ ] Verified port is `6543` (not `5432`)
- [ ] Verified username includes project ref: `postgres.zjcutguakjavahdrytxc`
- [ ] Password `@` is URL-encoded as `%40`
- [ ] Added `?schema=public` at the end
- [ ] Ran `npx prisma db push` successfully
- [ ] Tables created in Supabase Dashboard

---

**Next Step:** Get the exact connection pooler URL from Supabase Dashboard and update `.env`!

