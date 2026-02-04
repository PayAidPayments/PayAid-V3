# 🌱 Seed Demo Data on Vercel Production

## Quick Start

After deploying to Vercel, seed comprehensive demo data using one of these methods:

### Method 1: Browser Console (Easiest - Recommended)

1. **Login to Vercel production:** https://payaid-v3.vercel.app/login
   - Email: `admin@demo.com`
   - Password: `Test@1234`

2. **Open browser console** (F12)

3. **Run comprehensive seed in background:**
   ```javascript
   fetch('/api/admin/seed-demo-data?comprehensive=true&background=true', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     }
   })
   .then(r => r.json())
   .then(data => {
     console.log('✅ Seed started:', data)
     alert('Comprehensive seed started! Wait 1-2 minutes then refresh the dashboard.')
   })
   .catch(err => {
     console.error('❌ Error:', err)
     alert('Error starting seed. Check console.')
   })
   ```

4. **Wait 1-2 minutes** for seeding to complete

5. **Refresh the CRM dashboard** - you should see:
   - 12+ deals created
   - ₹20.7L+ revenue
   - 26+ deals closing
   - 200+ overdue tasks
   - Full pipeline data

### Method 2: Direct URL (GET Request)

Visit this URL after logging in:
```
https://payaid-v3.vercel.app/api/admin/seed-demo-data?trigger=true&comprehensive=true&background=true
```

### Method 3: curl Command

```bash
curl -X POST "https://payaid-v3.vercel.app/api/admin/seed-demo-data?comprehensive=true&background=true" \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

## What Gets Seeded

The comprehensive seed creates:

### CRM Module
- ✅ **150+ Contacts** (Prospects, Contacts, Customers)
- ✅ **200+ Deals** (across all pipeline stages)
- ✅ **300+ Tasks** (including overdue tasks)
- ✅ **500+ Activities** (calls, emails, meetings)
- ✅ **100+ Meetings** (scheduled across dates)
- ✅ **10+ Lead Sources** (with conversion metrics)

### Sales & Billing Module
- ✅ **400+ Orders** (with line items)
- ✅ **350+ Invoices** (paid, pending, overdue)
- ✅ **15+ Products** (with pricing)

### Marketing Module
- ✅ **32+ Campaigns** (email, social, content)
- ✅ **8+ Landing Pages** (with visitor data)
- ✅ **Lead source attribution**

### Support Module
- ✅ **50+ Support Tickets** (open, resolved, pending)
- ✅ **Ticket categories and priorities**

### Operations Module
- ✅ **Inventory items**
- ✅ **Purchase orders**
- ✅ **Vendor management**

### Date Range
All data spans **March 2025 - February 2026** for realistic demo scenarios.

## Verify Seeding Completed

After seeding, check:

1. **CRM Dashboard:** Should show real numbers instead of zeros
2. **API Check:** Visit `/api/admin/check-dashboard-data` (requires login)
3. **Console Logs:** Check Vercel function logs for completion messages

## Troubleshooting

### Seed Times Out
- ✅ Use `?background=true` parameter (runs async, no timeout)
- ✅ Wait 1-2 minutes for background seed to complete
- ✅ Check Vercel function logs for progress

### No Data After Seeding
- ✅ Verify you're logged in as `admin@demo.com`
- ✅ Check tenant ID matches "Demo Business Pvt Ltd"
- ✅ Refresh dashboard after 1-2 minutes
- ✅ Check Vercel logs for errors

### Connection Pool Errors
- ✅ Use `?background=true` to avoid connection limits
- ✅ Wait for other operations to complete
- ✅ Retry after a few minutes

## Background vs Synchronous

- **Background (`?background=true`)**: Starts seed and returns immediately. Best for Vercel Hobby plan (10s timeout).
- **Synchronous**: Waits for completion. May timeout on Vercel Hobby plan.

**Recommendation:** Always use `?background=true` on Vercel production.

## Next Steps

After successful seeding:
1. ✅ Refresh CRM dashboard - should show full data
2. ✅ Check Finance dashboard - should show invoices and orders
3. ✅ Check Marketing dashboard - should show campaigns
4. ✅ Verify all modules have data

---

**Note:** The comprehensive seed takes 30-60 seconds to complete. Be patient and refresh after waiting.
