# How to Seed Demo Data

## Quick Fix for 405 Error

If you're getting a 405 error, the deployment might not be complete yet. Try these methods:

### Method 1: Use Browser Console (Works Immediately)

1. **Login first** at https://payaid-v3.vercel.app/login
2. **Open browser console** (F12)
3. **Run this command:**
   ```javascript
   fetch('/api/admin/seed-demo-data', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     }
   })
   .then(r => r.json())
   .then(data => {
     console.log('Seed Result:', data)
     alert('Data seeded! Check console for details.')
   })
   .catch(err => {
     console.error('Error:', err)
     alert('Error seeding data. Check console.')
   })
   ```

### Method 2: Use curl (Command Line)

```bash
curl -X POST https://payaid-v3.vercel.app/api/admin/seed-demo-data \
  -H "Content-Type: application/json"
```

### Method 3: Wait for Deployment

If the GET handler isn't working yet:
1. Wait 2-3 minutes for Vercel to deploy
2. Try visiting: https://payaid-v3.vercel.app/api/admin/seed-demo-data?trigger=true
3. Or use Method 1 (browser console) which always works

## What Gets Seeded

- ✅ 20+ Contacts
- ✅ 20+ Deals (including won deals for revenue)
- ✅ 15+ Tasks (including overdue tasks)
- ✅ 10 Lead Sources with metrics
- ✅ Products, Invoices, Orders, Purchase Orders

## After Seeding

1. Refresh your CRM dashboard
2. Stats should now show real numbers instead of zeros
3. Check: https://payaid-v3.vercel.app/api/admin/check-dashboard-data (requires login)
