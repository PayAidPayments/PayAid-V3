# CRM Data Recovery Guide

## Issue Summary

You're seeing:
- **500 errors** on `/crm/cmjptk2mw0000aocw31u48n64/Home` 
- **500 errors** on `/api/ai/insights`
- **401 Unauthorized** when trying to seed data
- **All zeros** on dashboard (no data showing)

## Root Causes

1. **AI Insights API failing** - Requires 'ai-studio' module access, may not be enabled
2. **Seed script authentication** - Requires auth header in production
3. **Data may have been deleted** - Seed script recreates tenant if ID doesn't match expected format
4. **Tenant ID mismatch** - Your tenant ID `cmjptk2mw0000aocw31u48n64` doesn't match expected personalized format

## Fixes Applied

### ✅ Fix 1: AI Insights API
- Now returns fallback data instead of 500 error
- Prevents dashboard crashes

### ✅ Fix 2: Seed Script Authentication
- Now checks for session authentication if no auth header
- Works with logged-in users

### ✅ Fix 3: Data Preservation
- Seed script now checks for existing data before deleting
- Preserves data if substantial data exists

## Step-by-Step Recovery

### Step 1: Check Current Data Status

Run this script to see what data exists:

```bash
npx tsx scripts/check-tenant-data.ts cmjptk2mw0000aocw31u48n64
```

This will show:
- Current data counts
- Admin user status
- Recent deals
- Current month stats

### Step 2: Seed Data (With Authentication)

**Option A: Browser Console (Recommended)**

1. **Login first** at https://payaid-v3.vercel.app/login
2. **Open browser console** (F12)
3. **Run this command:**

```javascript
// Get token from localStorage
const token = localStorage.getItem('token') || localStorage.getItem('authToken')

fetch('/api/admin/seed-demo-data?background=true', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(d => {
  console.log('✅ Seed Result:', d)
  if (d.counts) {
    console.log('📊 Records:')
    console.log(`  - Contacts: ${d.counts.contacts || 0}`)
    console.log(`  - Deals: ${d.counts.deals || 0}`)
    console.log(`  - Tasks: ${d.counts.tasks || 0}`)
    console.log(`  - Meetings: ${d.counts.meetings || 0}`)
    console.log(`  - Total CRM Records: ${d.counts.totalCRMRecords || 0}`)
  }
  alert('✅ Demo data seeded! Refresh the dashboard in 30-60 seconds.')
})
.catch(err => {
  console.error('❌ Error:', err)
  alert('❌ Error seeding data. Check console.')
})
```

**Option B: Use Script**

```bash
# First, get your token from browser localStorage or login
npx tsx scripts/seed-demo-data.ts cmjptk2mw0000aocw31u48n64 YOUR_TOKEN
```

### Step 3: Verify Data After Seeding

Wait 30-60 seconds for background seeding to complete, then:

```bash
npx tsx scripts/check-tenant-data.ts cmjptk2mw0000aocw31u48n64
```

You should see:
- 800+ contacts
- 600+ deals
- 500+ tasks
- 100+ meetings

### Step 4: Refresh Dashboard

1. **Hard refresh** browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Navigate to**: `/crm/cmjptk2mw0000aocw31u48n64/Home`
3. **Check console** - should see no errors
4. **Verify stats** - should show real numbers

## Troubleshooting

### Issue: Still getting 401 Unauthorized

**Solution:**
1. Make sure you're logged in
2. Check browser console for token in localStorage
3. Use browser console method (Option A) which uses your session

### Issue: Data still showing zeros after seeding

**Possible causes:**
1. **Tenant ID mismatch** - Seed script might have created a different tenant
2. **Seeding still in progress** - Wait 60 seconds and refresh
3. **Data was seeded to wrong tenant** - Check which tenant has data

**Check:**
```bash
npx tsx scripts/check-tenant-data.ts cmjptk2mw0000aocw31u48n64
```

If this shows zeros, check if there's another tenant with data:
```sql
-- In Prisma Studio or database
SELECT id, name, subdomain FROM "Tenant" WHERE subdomain = 'demo';
```

### Issue: Seed script creates new tenant instead of using existing

**Solution:**
The seed script looks for tenant with `subdomain: 'demo'`. If your tenant has a different subdomain, it will create a new one.

**Fix:** Update your tenant's subdomain to 'demo', or modify the seed script to use your tenant ID directly.

### Issue: 500 error on Home page

**This is likely from:**
1. Server-side rendering issue
2. Missing data causing API errors
3. AI insights API failing (now fixed)

**Solution:**
1. Check server logs for actual error
2. Verify all API routes are working
3. Clear browser cache and hard refresh

## Expected Results After Fixes

✅ **No 500 errors** on AI insights API (returns fallback data)
✅ **Seed script works** with session authentication
✅ **Data preserved** if substantial data exists
✅ **Dashboard loads** without crashing
✅ **Stats show real numbers** after seeding

## Next Steps

1. ✅ Fixes have been applied and pushed
2. ⏳ Wait for Vercel deployment (2-3 minutes)
3. 🔄 Refresh dashboard after deployment
4. 🌱 Seed data using browser console method
5. ✅ Verify data appears on dashboard

## Quick Reference

**Check data:**
```bash
npx tsx scripts/check-tenant-data.ts cmjptk2mw0000aocw31u48n64
```

**Seed data (browser console):**
```javascript
fetch('/api/admin/seed-demo-data?background=true', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log)
```

**Check dashboard data API:**
```javascript
fetch('/api/admin/check-dashboard-data', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(console.log)
```
