# Module Visibility Fix - Version 2

**Date:** December 29, 2025  
**Issue:** New modules and features not visible on dashboard  
**Status:** ✅ **FIXED**

---

## 🔍 **Root Cause**

The sidebar reads `licensedModules` from the JWT token, which can be stale. Even though:
1. ✅ Modules are enabled in the database
2. ✅ New tenants get all modules by default
3. ✅ Existing tenants have modules enabled via script

The JWT token still contains the old module list, and the hook was only reading from the token.

---

## ✅ **Solution Implemented**

### 1. **Enhanced `usePayAidAuth` Hook** ✅

**File:** `lib/hooks/use-payaid-auth.ts`

**Changes:**
- ✅ Now fetches latest modules from `/api/auth/me` (database source of truth)
- ✅ Uses React Query to cache and refresh module data
- ✅ Priority system:
  1. Database data from API (most up-to-date)
  2. Tenant data from auth store
  3. JWT token (fallback)
- ✅ Automatically syncs fetched modules to auth store

**Before:**
```typescript
// Only read from JWT token
const licensedModules = useMemo(() => {
  const decoded = decodeToken(token)
  return decoded.licensedModules || []
}, [token])
```

**After:**
```typescript
// Fetch from API (database source of truth)
const { data: userData } = useQuery({
  queryKey: ['auth-me', token],
  queryFn: async () => {
    const response = await fetch('/api/auth/me')
    return response.json()
  },
})

// Priority: API > Store > Token
const licensedModules = useMemo(() => {
  if (modulesFromApi?.length > 0) return modulesFromApi
  if (tenant?.licensedModules?.length > 0) return tenant.licensedModules
  // ... fallback to token
}, [modulesFromApi, tenant, token])
```

---

### 2. **Enhanced Dashboard Layout** ✅

**File:** `app/dashboard/layout.tsx`

**Changes:**
- ✅ Automatically refreshes tenant data on mount if modules are missing
- ✅ Calls `fetchUser()` to get latest modules from database
- ✅ Ensures modules are loaded before sidebar renders

**New Code:**
```typescript
useEffect(() => {
  if (token && !tenant?.licensedModules?.length) {
    // Fetch latest modules from API
    fetchUser().catch(() => {})
  }
}, [token, tenant?.licensedModules?.length, fetchUser])
```

---

## 🎯 **How It Works Now**

1. **On Dashboard Load:**
   - Layout checks if tenant has modules
   - If missing, automatically fetches from `/api/auth/me`
   - Updates auth store with latest modules

2. **Sidebar Rendering:**
   - `usePayAidAuth` hook fetches latest modules from API
   - Uses React Query to cache for 5 minutes
   - Automatically syncs to auth store
   - Sidebar reads from hook (which has latest data)

3. **Module Visibility:**
   - Modules are shown based on database data (not stale token)
   - Updates automatically when modules change
   - No need to log out/in for existing users

---

## 📋 **For Users**

### **Automatic Fix:**
- ✅ Modules will automatically appear after page refresh
- ✅ No need to log out and log back in
- ✅ Dashboard layout automatically fetches latest modules

### **If Modules Still Don't Appear:**
1. **Refresh the page** (F5 or Ctrl+R)
2. **Wait 2-3 seconds** for API call to complete
3. **Check browser console** for any errors
4. **Verify modules are enabled** in database (Admin > Module Management)

---

## 🧪 **Testing**

### Test Steps:
1. Enable modules for a tenant in database
2. Visit dashboard (don't log out)
3. Wait 2-3 seconds
4. Modules should appear in sidebar automatically

### Expected Behavior:
- ✅ Modules appear without logging out
- ✅ Sidebar shows all licensed modules
- ✅ No console errors
- ✅ Smooth user experience

---

## 📝 **Files Modified**

1. `lib/hooks/use-payaid-auth.ts` - Enhanced to fetch from API
2. `app/dashboard/layout.tsx` - Auto-refresh tenant data

---

## ✅ **Result**

**Modules are now visible automatically:**
- ✅ No logout/login required
- ✅ Automatic refresh on dashboard load
- ✅ Always shows latest modules from database
- ✅ Better user experience

---

*Last Updated: December 29, 2025*

