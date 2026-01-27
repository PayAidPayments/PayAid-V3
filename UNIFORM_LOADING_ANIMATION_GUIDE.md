# Uniform Loading Animation Guide

## Issue
Different modules were showing different loading animations:
- CRM Dashboard: Shows `PageLoading` with oval animation and business name
- Other Modules: Showing circular spinner (old style)

## Solution: Standardize to PageLoading

All module entry points and dashboards should use `PageLoading` or `DashboardLoading` for consistency.

## Updated Components

### ✅ Loading Component Updated
**File:** `components/ui/loading.tsx`

**Changes:**
- Updated default `spinner` variant to match `PageLoading` style
- Now uses bouncing dots + progress bar (same as PageLoading)
- Consistent design system colors (Deep Teal + Vibrant Blue)

**Before:**
- Circular spinner with rotating border
- Different from PageLoading

**After:**
- Bouncing dots animation
- Progress bar
- Matches PageLoading style

## Module Entry Points to Update

All module entry points should use `PageLoading`:

### ✅ Already Using PageLoading:
- `app/crm/page.tsx` ✅
- `app/crm/[tenantId]/Home/page.tsx` ✅ (uses DashboardLoading)

### ⚠️ Need to Update:
Check these files and update to use `PageLoading`:

1. **Sales Module:**
   - `app/sales/page.tsx`
   - `app/sales/[tenantId]/Home/page.tsx`

2. **Marketing Module:**
   - `app/marketing/page.tsx`
   - `app/marketing/[tenantId]/Home/page.tsx`

3. **Finance Module:**
   - `app/finance/page.tsx`
   - `app/finance/[tenantId]/Home/page.tsx`

4. **HR Module:**
   - `app/hr/page.tsx`
   - `app/hr/[tenantId]/Home/page.tsx`

5. **Other Modules:**
   - Check all `app/[module]/page.tsx` files
   - Check all `app/[module]/[tenantId]/Home/page.tsx` files

## Update Pattern

**Replace:**
```typescript
// Old - Circular spinner
<div className="flex items-center justify-center">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
</div>
```

**With:**
```typescript
// New - Standardized PageLoading
import { PageLoading } from '@/components/ui/loading'

return <PageLoading message="Loading [Module Name]..." fullScreen={true} />
```

## For Dashboard Pages

Use `DashboardLoading` (which wraps `PageLoading`):

```typescript
import { DashboardLoading } from '@/components/ui/loading'

if (loading) {
  return <DashboardLoading message="Loading [Module] dashboard..." />
}
```

## Benefits

1. ✅ **Consistent UX** - Same loading experience across all modules
2. ✅ **Brand Identity** - Shows business name in loading animation
3. ✅ **Professional** - Modern, polished animation
4. ✅ **Design System** - Uses correct colors (Deep Teal + Vibrant Blue)

## Testing

After updating modules:
1. Navigate to each module entry point
2. Verify loading animation matches CRM dashboard
3. Check that business name appears in loading animation
4. Verify colors are consistent (teal/blue, not purple)

## Files Changed

1. `components/ui/loading.tsx` - Updated spinner variant to match PageLoading style

## Next Steps

1. Update all module entry points to use `PageLoading`
2. Update all dashboard pages to use `DashboardLoading`
3. Remove any custom loading spinners
4. Test all modules for consistency
