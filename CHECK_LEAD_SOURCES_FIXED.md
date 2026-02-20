# Check Lead Sources - Fixed Method ✅

## Issues Found

1. **503 Service Unavailable** - Seed operation is blocking requests (for 30 seconds after start)
2. **401 Unauthorized** - Manual check used invalid token from localStorage

## Solution: Wait for Seed to Complete

The 503 error means a seed operation just started. Wait 30-60 seconds, then refresh the dashboard.

## Better Way to Check Lead Sources

Instead of manual fetch, use the dashboard's built-in method:

### Option 1: Check Dashboard Directly

1. **Wait 30-60 seconds** after seed started
2. **Refresh the CRM Dashboard** (`/crm/[tenantId]/Home`)
3. **Check the TOP 10 Lead Sources chart** - should show data

### Option 2: Check via Browser Console (After Seed Completes)

Use the auth store token (more reliable):

```javascript
// Get token from auth store (more reliable than localStorage)
const authStore = window.__PAYAID_AUTH_STORE__ || {}
const token = authStore.getState?.()?.token || localStorage.getItem('token')

if (!token) {
  console.error('❌ No token found. Please log in first.')
} else {
  fetch('/api/crm/dashboard/stats?period=month', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  .then(r => {
    if (!r.ok) {
      console.error('❌ API Error:', r.status, r.statusText)
      return r.json().then(data => {
        console.error('Error details:', data)
        throw new Error(data.message || 'API request failed')
      })
    }
    return r.json()
  })
  .then(data => {
    console.log('✅ Top Lead Sources:', data.topLeadSources)
    console.log('📊 Count:', data.topLeadSources?.length || 0)
    if (data.topLeadSources?.length === 0) {
      console.warn('⚠️ No lead sources with leadsCount > 0 found')
      console.log('💡 Run seed script to create lead sources with stats')
    } else {
      console.log('✅ Lead sources found! Chart should display data.')
      data.topLeadSources.forEach((source, idx) => {
        console.log(`${idx + 1}. ${source.name}: ${source.leadsCount} leads, ${source.conversionRate.toFixed(1)}% conversion`)
      })
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message)
    if (err.message.includes('503')) {
      console.log('💡 Seed is running. Wait 30 seconds and try again.')
    } else if (err.message.includes('401')) {
      console.log('💡 Token expired. Please refresh the page and log in again.')
    }
  })
```

## Understanding the 503 Error

The API returns 503 when:
- Seed operation started less than 30 seconds ago
- This prevents database connection pool exhaustion
- **Solution:** Wait 30-60 seconds, then refresh

## Understanding the 401 Error

The API returns 401 when:
- Token is missing or invalid
- Token expired
- Token doesn't have required permissions

**Solution:** 
- Refresh the page to get a new token
- Or log out and log in again

## Steps to Fix Lead Sources

### Step 1: Check if Seed is Running

Look at terminal where `npm run dev` is running. You should see:
- `[SEED] Starting comprehensive seed...`
- `✅ Created 20 lead sources`
- `✅ Seed completed`

### Step 2: Wait for Seed to Complete

If seed just started:
- **Wait 30-60 seconds** for seed to complete
- Don't refresh during this time (will get 503)

### Step 3: Refresh Dashboard

After seed completes:
- **Refresh the CRM Dashboard page**
- **Check TOP 10 Lead Sources chart**
- Should show data now

### Step 4: Verify Lead Sources

If chart still empty:
1. Check browser console for errors
2. Check terminal for seed completion messages
3. Run the better check script above (after seed completes)

## Quick Diagnostic

Run this after seed completes (wait 30+ seconds):

```javascript
// Check if seed is still blocking
fetch('/api/admin/seed-demo-data?checkStatus=true')
  .then(r => r.json())
  .then(data => {
    if (data.running) {
      console.log(`⏳ Seed still running: ${data.elapsedSeconds}s elapsed`)
      console.log('💡 Wait a bit longer, then refresh dashboard')
    } else {
      console.log('✅ Seed completed. Dashboard should work now.')
      console.log('💡 Refresh the dashboard page')
    }
  })
```

## Expected Result

After seed completes and you refresh:
- ✅ TOP 10 Lead Sources chart shows data
- ✅ Chart displays bars for each source
- ✅ Tooltips show: Name, Leads Count, Conversions, Conversion Rate
- ✅ Sources sorted by leadsCount (highest first)

## If Still Not Working

1. **Check terminal logs** - Look for seed completion
2. **Check browser console** - Look for API errors
3. **Verify database connection** - Check if DATABASE_URL is correct
4. **Try manual seed again** - Run seed script one more time

The 503 error is temporary - it will resolve once the seed completes!
