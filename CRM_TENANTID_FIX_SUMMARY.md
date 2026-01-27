# CRM tenantId Fix Summary

## Issue
"tenantId is not defined" error when clicking on CRM from home page

## Root Causes Identified

1. **ModuleCard Component** - Was using `tenantId` without proper type checking
2. **ModuleSwitcher Component** - Referenced `tenantId` without declaring it
3. **getModuleUrl Function** - Didn't accept tenantId parameter, returning entry point URLs
4. **CRM Layout Files** - Many layouts used `params.tenantId as string` without guards
5. **Old Dashboard URLs** - Some components still reference `/dashboard/contacts`, `/dashboard/deals` etc.

## Fixes Applied

### 1. Created Shared Utility Function
**File:** `lib/utils/get-tenant-id.ts`
- Handles both string and array params from Next.js
- Provides fallback to auth store tenant ID
- Includes proper type validation

### 2. Fixed CRM Layout Files (13 files)
All CRM layouts now use `useTenantId()` hook with proper guards:
- `app/crm/[tenantId]/Home/layout.tsx`
- `app/crm/[tenantId]/CPQ/layout.tsx`
- `app/crm/[tenantId]/Deals/layout.tsx`
- `app/crm/[tenantId]/Leads/layout.tsx`
- `app/crm/[tenantId]/Tasks/layout.tsx`
- `app/crm/[tenantId]/SalesAutomation/layout.tsx`
- `app/crm/[tenantId]/Contacts/layout.tsx`
- `app/crm/[tenantId]/AllPeople/layout.tsx`
- `app/crm/[tenantId]/Meetings/layout.tsx`
- `app/crm/[tenantId]/Dialer/layout.tsx`
- `app/crm/[tenantId]/Visitors/layout.tsx`
- `app/crm/[tenantId]/CustomerSuccess/layout.tsx`
- `app/crm/[tenantId]/SalesEnablement/layout.tsx`

### 3. Fixed ModuleCard Component
**File:** `app/home/components/ModuleCard.tsx`
- Added proper tenantId extraction with type checking
- Ensured URLs are never created with undefined tenantId
- Returns base URL if tenantId not available (will redirect)

### 4. Fixed ModuleSwitcher Component
**File:** `components/modules/ModuleSwitcher.tsx`
- Declared `tenantId` variable properly
- Passes tenantId to `getModuleUrl()` function

### 5. Updated getModuleUrl Function
**File:** `lib/sso/token-manager.ts`
- Now accepts optional `tenantId` parameter
- Returns full path `/module/[tenantId]/Home/` when tenantId provided
- Returns entry point `/module` when tenantId not available

### 6. Fixed CRM Entry Point
**File:** `app/crm/page.tsx`
- Added type checking for tenant.id
- Redirects to `/home` instead of `/dashboard` if no tenant

### 7. Improved CRM Home Page
**File:** `app/crm/[tenantId]/Home/page.tsx`
- Better type safety for tenantId
- More defensive checks before using tenantId

## Current URL Structure

### Correct Module URLs:
- **CRM:** `/crm/[tenantId]/Home/`
- **Sales:** `/sales/[tenantId]/Home/`
- **Finance:** `/finance/[tenantId]/Home/`
- **Marketing:** `/marketing/[tenantId]/Home/`
- **HR:** `/hr/[tenantId]/Home/`
- **Projects:** `/projects/[tenantId]/Home/`
- **Inventory:** `/inventory/[tenantId]/Home/`

### Entry Points (redirect to tenant-specific URLs):
- `/crm` → `/crm/[tenantId]/Home/`
- `/sales` → `/sales/[tenantId]/Home/`
- etc.

## Remaining Issues to Check

1. **Old Dashboard URLs** - Some components still use:
   - `/dashboard/contacts` → Should be `/crm/[tenantId]/Contacts`
   - `/dashboard/deals` → Should be `/crm/[tenantId]/Deals`
   - `/dashboard/tasks` → Should be `/crm/[tenantId]/Tasks`

2. **Components Using Old URLs:**
   - `components/layout/sidebar.tsx`
   - `components/modules/CRMTopBar.tsx`
   - `components/crm/DealRotWidget.tsx`

## Testing Checklist

After deployment, verify:
- [ ] Clicking CRM from home page works
- [ ] URL shows `/crm/[tenantId]/Home/`
- [ ] No "tenantId is not defined" errors in console
- [ ] Navigation within CRM module works
- [ ] All CRM sub-pages load correctly

## Next Steps if Error Persists

1. Check browser console (F12) for exact error message and stack trace
2. Check which component/file is causing the error
3. Verify tenantId is available in auth store
4. Check if error happens during SSR or client-side render
