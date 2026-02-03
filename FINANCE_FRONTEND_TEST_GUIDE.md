# Finance Dashboard Frontend Testing Guide

## Overview
Automated frontend testing for the Finance Dashboard using Playwright.

## Prerequisites

1. **Server Running**: The dev server must be running
   ```bash
   npm run dev
   ```

2. **Playwright Installed**: ✅ Already installed in `package.json`

3. **Test Credentials**:
   - Email: `admin@demo.com`
   - Password: `Test@1234`

## Running Tests

### Basic Usage
```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run tests
npx tsx scripts/test-finance-frontend.ts [tenantId]
```

### With Custom Tenant ID
```bash
npx tsx scripts/test-finance-frontend.ts cmjimytmb0000snopu3p8h3b9
```

### With Custom Base URL
```bash
BASE_URL=https://payaid-v3.vercel.app npx tsx scripts/test-finance-frontend.ts [tenantId]
```

## Test Coverage

### ✅ Authentication
- Login flow
- Session handling
- Redirect to dashboard

### ✅ KPI Cards / Metrics
- UniversalModuleHero metrics detection
- Revenue, Invoices, Purchase Orders, Net Profit
- Currency display (₹)

### ✅ Charts
- SVG elements detection
- Chart containers
- Revenue Trend, P&L, Expense charts

### ✅ Tables
- Table elements
- Table headers
- Data display

### ✅ Filters
- Filter controls
- Date range filters
- Dropdown filters

### ✅ Export Functionality
- Export buttons
- PDF/Excel/CSV options

### ✅ Performance
- Page load time (< 10s acceptable)
- Console error detection
- Network performance

### ✅ Responsive Design
- Mobile viewport (375x667)
- Desktop viewport (1920x1080)
- Layout adaptation

## Test Results

### Expected Output
```
🧪 Finance Dashboard Frontend Testing

Base URL: http://localhost:3000
Tenant ID: cmjimytmb0000snopu3p8h3b9
Test Email: admin@demo.com

Checking if server is running...
✅ Server is running

Navigating to: http://localhost:3000/finance/cmjimytmb0000snopu3p8h3b9/Home/

✅ Authentication > Login - Login successful
✅ KPI Cards > KPI Cards Display - Found metrics
✅ Charts > Charts Render - Found SVG elements
✅ Performance > Console Errors - No console errors
✅ Responsive > Mobile Viewport - Page renders on mobile

📊 Test Results Summary:
────────────────────────────────────────────────────────────────────────────────
✅ Passed: X
❌ Failed: Y
⏭️  Skipped: Z

Total: 13 tests
```

## Troubleshooting

### Server Not Running
**Error:** `❌ Server is not running!`

**Solution:**
```bash
npm run dev
```

### Login Timeout
**Error:** `page.waitForURL: Timeout 10000ms exceeded`

**Solution:**
- Check if credentials are correct
- Verify tenant ID exists
- Check server logs for errors
- Try direct navigation (script has fallback)

### No KPI Cards Found
**Error:** `No KPI cards found`

**Solution:**
- Finance dashboard uses `UniversalModuleHero` component
- Metrics are displayed in hero section, not traditional KPI cards
- Check if dashboard data is loading correctly
- Verify API endpoint `/api/finance/dashboard/stats` is working

### Slow Page Load
**Warning:** `Page Load Time > 10s`

**Solution:**
- Check network connectivity
- Verify database queries are optimized
- Check for slow API endpoints
- Review server logs for bottlenecks

## Test Script Features

### ✅ Server Health Check
- Checks if server is running before tests
- Provides helpful error messages

### ✅ Flexible Login
- Handles finance module login flow
- Fallback to direct navigation if login fails
- Supports already-logged-in sessions

### ✅ Smart Selectors
- Detects UniversalModuleHero metrics
- Looks for currency symbols (₹)
- Flexible metric detection

### ✅ Performance Monitoring
- Measures page load time
- Detects console errors
- Network performance tracking

### ✅ Responsive Testing
- Tests mobile viewport
- Tests desktop viewport
- Layout adaptation verification

## Environment Variables

```bash
BASE_URL=http://localhost:3000  # Default
TEST_EMAIL=admin@demo.com       # Default
TEST_PASSWORD=Test@1234         # Default
```

## Integration with CI/CD

The test script can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Finance Frontend Tests
  run: |
    npm run dev &
    sleep 10
    npx tsx scripts/test-finance-frontend.ts ${{ secrets.TENANT_ID }}
```

## Next Steps

1. ✅ Test script created and improved
2. ⏳ Run tests when server is available
3. ⏳ Review test results
4. ⏳ Fix any failing tests
5. ⏳ Add to CI/CD pipeline

## Related Files

- `scripts/test-finance-frontend.ts` - Test script
- `app/finance/[tenantId]/Home/page.tsx` - Dashboard page
- `components/modules/UniversalModuleHero.tsx` - Hero component
- `TODO_LIST_FINANCIAL_DASHBOARD.md` - TODO list
