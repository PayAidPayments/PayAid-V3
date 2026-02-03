# Seed Demo Data - Instructions

## Overview
The seed script automatically creates comprehensive demo data for the CRM module, including:
- **50+ Contacts** (Prospects, Contacts, Customers)
- **50+ Deals** (across all stages and quarters)
- **30+ Tasks** (overdue and upcoming)
- **15+ Meetings** (scheduled across different dates)
- **20+ Visitor Sessions** (with page visits and events)
- **Lead Sources** (with proper attribution)
- **Products, Invoices, Orders** (for complete CRM functionality)

## Automatic Seeding

The seed script runs **automatically** when you access the CRM dashboard:

1. When you visit `/crm/[tenantId]/Home/`, the dashboard checks if data exists
2. If no data is found, it automatically seeds demo data in the background
3. The dashboard refreshes after seeding completes

**No manual action required!** Just visit the CRM dashboard and data will be created automatically.

## Manual Seeding

If you want to manually trigger the seed script:

### Option 1: Browser Console
```javascript
// Open browser console (F12) and run:
fetch('/api/admin/seed-demo-data', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(res => res.json())
.then(data => console.log('Seed result:', data))
```

### Option 2: Direct API Call
```bash
# Using curl (replace YOUR_TOKEN with actual token)
curl -X POST http://localhost:3000/api/admin/seed-demo-data \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Option 3: Browser URL (GET request)
Visit: `http://localhost:3000/api/admin/seed-demo-data?trigger=true`

## Check Data Status

To verify if data exists:

### Option 1: API Endpoint
```bash
curl http://localhost:3000/api/admin/check-dashboard-data \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Option 2: Browser
Visit: `http://localhost:3000/api/admin/check-dashboard-data`

Response will show:
```json
{
  "hasData": true,
  "counts": {
    "contacts": 50,
    "deals": 50,
    "tasks": 30,
    "leadSources": 10
  }
}
```

## What Gets Created

### Contacts (50+)
- **20 Prospects** - High-intent leads with lead scores 50-80
- **15 Contacts** - Qualified leads in active discussions
- **15 Customers** - Active customers with deals and invoices

### Deals (50+)
- **Q1 Deals** (Apr-Jun) - Historical won deals
- **Q2 Deals** (Jul-Sep) - Historical won deals
- **Q3 Deals** (Oct-Dec) - Historical won deals
- **Q4 Deals** (Jan-Mar) - Current quarter deals
- **Active Deals** - Deals created this month
- **Won Deals** - Deals won this month (for revenue)
- **Closing Deals** - Deals closing this month

### Tasks (30+)
- **15 Overdue Tasks** - Past due dates
- **15 Upcoming Tasks** - Future due dates
- Mix of priorities: High, Medium, Low

### Meetings (15+)
- Scheduled across next 14 days
- Mix of statuses: scheduled, in-progress, ended
- Linked to contacts

### Visitor Sessions (20+)
- Website sessions with page visits
- High-intent events (form submissions, scroll depth)
- Geographic data (country, city)
- Device/browser information

## Data Distribution

### Time Distribution
- **Current Month**: Active deals, tasks, meetings
- **Last 12 Months**: Historical contacts and deals
- **Q4 (Jan-Mar)**: Recent deals for quarterly charts

### Stage Distribution
- **Prospects**: 20 contacts (stage='prospect')
- **Contacts**: 15 contacts (stage='contact')
- **Customers**: 15 contacts (stage='customer')

### Deal Stages
- **Qualified**: 20%
- **Proposal**: 25%
- **Negotiation**: 30%
- **Won**: 20%
- **Lost**: 5%

## Troubleshooting

### Issue: Dashboard shows 0s
**Solution**: 
1. Check if data exists: `/api/admin/check-dashboard-data`
2. If `hasData: false`, seed data manually
3. Refresh the dashboard page

### Issue: Seed script fails
**Solution**:
1. Check server logs for errors
2. Verify database connection
3. Ensure tenant exists (subdomain='demo')
4. Check authentication token is valid

### Issue: Data not appearing
**Solution**:
1. Verify tenant ID matches
2. Check browser console for API errors
3. Wait a few seconds after seeding (data creation takes time)
4. Refresh the page

## Notes

- **Idempotent**: Running seed multiple times is safe (deletes old data first)
- **Background Process**: Seeding runs in background, doesn't block UI
- **Comprehensive**: Creates all data needed for full CRM functionality
- **Realistic**: Data is distributed across time periods for realistic charts

## Next Steps

After seeding:
1. ✅ Visit CRM Dashboard - See stats with real data
2. ✅ Check Deals page - See all deals
3. ✅ Check Contacts page - See all contacts
4. ✅ Check Tasks page - See all tasks
5. ✅ Check Sales Automation - See campaigns and prospects
6. ✅ Check Customer Success - See customer health scores
7. ✅ Check Visitors - See visitor sessions
8. ✅ Check Reports - See analytics reports

All pages should now display data instead of zeros!
