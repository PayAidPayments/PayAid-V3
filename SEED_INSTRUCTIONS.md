# Seed Script Instructions

## Current Status
All changes have been implemented:
- ✅ Personalized Tenant IDs (first word of business name + random suffix)
- ✅ Mass Transfer API endpoint
- ✅ Export Contacts API endpoint  
- ✅ AI Chat integration
- ✅ Updated Contacts page with all features

## Database Connection Pool Issue
The database connection pool is currently exhausted. To seed the data, please follow these steps:

## Method 1: Browser Console (Recommended)

1. Open your browser and go to `http://localhost:3000`
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Run this command:

```javascript
fetch('/api/admin/seed-demo-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => {
  console.log('✅ Success!', data);
  console.log('Tenant ID:', data.tenantId);
  console.log('Business Name:', data.businessName);
})
.catch(err => console.error('❌ Error:', err))
```

## Method 2: Wait and Retry

The database connection pool should free up after a few minutes. You can:
1. Wait 5-10 minutes
2. Try running the seed script again via browser console or API call

## Method 3: Restart Database (If Available)

If you have access to restart your PostgreSQL database:
1. Restart the PostgreSQL service
2. Wait for it to fully start
3. Run the seed script again

## Expected Result

After successful seeding, you should see:
- **Tenant ID**: `demo-xxxxxx` (personalized format with first word of business name)
- **Business Name**: "Demo Business Private Limited"
- Sample contacts, deals, tasks, and other data

## Verify Changes

1. **Check Tenant ID in URL**: 
   - After logging in, the URL should be like: `/crm/demo-xxxxxx/Home/`
   - Instead of: `/crm/clx1234567890abcdef/Home/`

2. **Check Contacts Page**:
   - Go to `/crm/demo-xxxxxx/Contacts`
   - Verify all features are working:
     - Mass Transfer button
     - Export Contacts button
     - AI Chat button (bottom right)
     - All filters and actions

3. **Test Mass Transfer**:
   - Select some contacts
   - Click "Actions" → "Mass Transfer"
   - Select a user and transfer

4. **Test Export**:
   - Click "Actions" → "Export Contacts"
   - File should download as Excel

5. **Test AI Chat**:
   - Click "AI" button in bottom bar or press Ctrl+Space
   - Chat should open and work (requires AI Studio module)

## Notes

- The seed script will create a new tenant with personalized ID if one doesn't exist
- If a tenant already exists with old CUID format, it will continue using that ID
- To get a personalized ID for existing tenant, you would need to delete and recreate it (only for demo/test data)

