# How to Check if PostgREST is Enabled in Supabase

## 🔍 Quick Answer

PostgREST is **enabled by default** in Supabase. Here's how to check and disable it if needed.

---

## 📋 Method 1: Check via Supabase Dashboard (Easiest)

### Step-by-Step with Screenshots Guide

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account

2. **Select Your Project:**
   - Click on your project from the list
   - (Look for your project name or reference ID like `zjcutguakjavahdrytxc`)

3. **Navigate to API Settings:**
   - In the **left sidebar**, look for the **⚙️ Settings** icon (gear/cog icon)
   - Click on **Settings**
   - In the settings menu, click on **API** (it's usually the first or second option)

4. **Check PostgREST Status:**
   - On the API settings page, you'll see several sections:
   
   **Look for these sections (if you see them, PostgREST is ENABLED):**
   - ✅ **"Project URL"** - Shows: `https://YOUR_PROJECT_REF.supabase.co`
   - ✅ **"API URL"** - Shows: `https://YOUR_PROJECT_REF.supabase.co/rest/v1/`
   - ✅ **"anon public"** key - A long JWT token starting with `eyJhbGci...`
   - ✅ **"service_role"** key - Another long JWT token
   
   **If you see these fields with values, PostgREST is ENABLED.**
   
   **If you don't see these sections or they're empty, PostgREST might be disabled (unlikely - it's enabled by default).**

### Visual Guide - What to Look For:

```
Supabase Dashboard
├── Left Sidebar
│   ├── 🏠 Home
│   ├── 📊 Table Editor
│   ├── 🔍 SQL Editor
│   ├── ⚙️ Settings  ← CLICK HERE
│   │   ├── General
│   │   ├── API  ← THEN CLICK HERE
│   │   ├── Database
│   │   └── ...
│   └── ...
└── Main Content Area
    └── API Settings Page
        ├── Project URL: https://xxx.supabase.co  ← SEE THIS?
        ├── API URL: https://xxx.supabase.co/rest/v1/  ← SEE THIS?
        ├── anon public key: eyJhbGci...  ← SEE THIS?
        └── service_role key: eyJhbGci...  ← SEE THIS?
        
        ✅ If YES to all → PostgREST is ENABLED
        ❌ If NO → PostgREST might be disabled (rare)
```

5. **Check if it's Actually Working:**
   - Copy the **anon/public** API key
   - Test the REST API endpoint:
     ```bash
     curl https://YOUR_PROJECT_REF.supabase.co/rest/v1/ \
       -H "apikey: YOUR_ANON_KEY" \
       -H "Authorization: Bearer YOUR_ANON_KEY"
     ```
   - If you get a response (even an error), PostgREST is active

---

## 📋 Method 2: Check via API Test

### Test PostgREST Endpoint

**Option A: Using curl**
```bash
# Replace with your actual project reference and API key
curl https://YOUR_PROJECT_REF.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Option B: Using Browser**
1. Go to: `https://YOUR_PROJECT_REF.supabase.co/rest/v1/`
2. You should see a response (even if it's an error)
3. If you get "404 Not Found" or connection error, PostgREST might be disabled

**Option C: Test with a Table**
```bash
# Test accessing a table (replace with your table name)
curl https://YOUR_PROJECT_REF.supabase.co/rest/v1/User \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Expected Responses:**
- ✅ **200 OK** or **401 Unauthorized** = PostgREST is enabled
- ❌ **404 Not Found** = PostgREST might be disabled
- ❌ **Connection refused** = PostgREST is disabled or project is paused

---

## 📋 Method 3: Check Project Settings

### Alternative Location

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your project

2. **Check Project Settings:**
   - Click **Settings** → **General**
   - Look for **"API"** or **"REST API"** section
   - Check if there's a toggle or status indicator

3. **Check Database Settings:**
   - Click **Settings** → **Database**
   - Look for **"Connection Pooling"** or **"API Access"** section
   - PostgREST is usually mentioned here

---

## 🔧 How to Disable PostgREST (If Needed)

### ⚠️ Important Note

**PostgREST cannot be fully disabled** in Supabase's standard dashboard. However, you can:

### Option 1: Restrict Access via RLS (Recommended)

Instead of disabling PostgREST, enable RLS on all tables:

1. **Enable RLS:**
   - Go to Supabase Dashboard → **SQL Editor**
   - Run: `ALTER TABLE "TableName" ENABLE ROW LEVEL SECURITY;`
   - Or use the migration: `prisma/migrations/enable_rls_complete.sql`

2. **Create Policies:**
   - Create RLS policies to restrict access
   - See: `RLS_SECURITY_IMPLEMENTATION.md`

### Option 2: Restrict API Keys

1. **Go to Settings → API:**
   - Revoke or restrict the **anon/public** API key
   - Only use **service_role** key (keep it secret!)

2. **Use Environment Variables:**
   - Don't expose API keys in client-side code
   - Only use service_role key server-side

### Option 3: Use Direct Database Connection Only

1. **Don't use Supabase Client:**
   - Use Prisma with direct connection string
   - Don't use `@supabase/supabase-js` client

2. **Connection String:**
   - Use direct connection (not pooler) if possible
   - Format: `postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres`

---

## 🎯 Quick Decision Guide

### If PostgREST is Enabled (Default):

**You have two options:**

1. **Enable RLS (Recommended):**
   - ✅ Provides database-level security
   - ✅ Defense-in-depth approach
   - ✅ Protects even if API keys leak
   - ⚠️ Requires RLS policies setup

2. **Restrict API Access:**
   - ✅ Don't expose anon key in client
   - ✅ Use service_role only server-side
   - ⚠️ Less secure than RLS

### If PostgREST is Disabled:

- ✅ No REST API exposure
- ✅ Only Prisma/direct connections work
- ✅ RLS warnings will disappear
- ⚠️ Can't use Supabase client features

---

## 🔍 Finding Your Project Details

### Get Project Reference

1. **From Supabase Dashboard:**
   - Go to Settings → **General**
   - Look for **"Reference ID"** or **"Project ID"**

2. **From Connection String:**
   - Your DATABASE_URL contains the project reference
   - Format: `postgres.PROJECT_REF@...`
   - Example: `postgres.zjcutguakjavahdrytxc@...`

### Get API Keys

1. **Go to Settings → API:**
   - **anon/public key:** For client-side (if using Supabase client)
   - **service_role key:** For server-side only (keep secret!)

---

## 📝 Quick Test Script

Create a test file to check PostgREST status:

```typescript
// test-postgrest.ts
const PROJECT_REF = 'YOUR_PROJECT_REF'
const ANON_KEY = 'YOUR_ANON_KEY'

async function checkPostgREST() {
  try {
    const response = await fetch(
      `https://${PROJECT_REF}.supabase.co/rest/v1/`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
      }
    )
    
    console.log('PostgREST Status:', response.status)
    console.log('PostgREST is:', response.status !== 404 ? 'ENABLED' : 'DISABLED')
  } catch (error) {
    console.log('PostgREST Status: ERROR (might be disabled or project paused)')
  }
}

checkPostgREST()
```

Run it:
```bash
npx tsx test-postgrest.ts
```

---

## ✅ Summary

### How to Check:

1. **Dashboard Method:**
   - Settings → API
   - Look for API URL and keys
   - If present, PostgREST is enabled

2. **API Test Method:**
   - Test: `https://PROJECT_REF.supabase.co/rest/v1/`
   - If you get a response, it's enabled

3. **Default Status:**
   - PostgREST is **enabled by default** in Supabase
   - You need to explicitly restrict access if you don't want it

### What to Do:

- **If using Prisma only:** Enable RLS for security
- **If using Supabase client:** Keep PostgREST enabled, but use RLS
- **If not using REST API:** Enable RLS anyway (defense-in-depth)

---

## 🔗 Related Files

- `RLS_QUICK_FIX.md` - Quick RLS fix guide
- `RLS_SECURITY_IMPLEMENTATION.md` - Complete RLS implementation
- `prisma/migrations/enable_rls_complete.sql` - RLS migration

---

**Status:** PostgREST is enabled by default in Supabase  
**Recommendation:** Enable RLS for security (see `RLS_QUICK_FIX.md`)

