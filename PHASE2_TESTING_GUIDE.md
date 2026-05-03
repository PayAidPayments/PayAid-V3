# Phase 2: Testing Guide

## 🧪 Quick Test Steps

### 1. Verify Dependencies
```bash
npm list @radix-ui/react-switch @radix-ui/react-dialog class-variance-authority
```
Should show installed packages.

### 2. Start Development Server
```bash
npm run dev
```

### 3. Test Module System

#### A. Login and Check Header
1. Login to the app
2. Look for "Modules" button in the header (next to theme toggle)
3. Click it - should open module switcher dialog

#### B. Test Module Switching
1. Click "Modules" button
2. Select a different module (e.g., CRM)
3. Should navigate to that module's first route
4. URL should change to `/crm` or similar

#### C. Test Route Protection
1. Try accessing `/crm` directly
2. If module is enabled for tenant: should work
3. If module is disabled: should redirect or show error

#### D. Test Admin Panel
1. Login as super admin
2. Navigate to `/admin/tenants`
3. Select a tenant
4. Go to "Modules" tab
5. Toggle modules on/off
6. Verify changes reflect in module switcher

---

## 🔍 Expected Behavior

### ModuleSwitcher
- ✅ Shows all enabled modules for current tenant
- ✅ Displays module name, description, and icon
- ✅ Highlights current module
- ✅ Clicking a module navigates to its first route

### Route Protection
- ✅ Unauthorized access redirects to login
- ✅ Disabled modules redirect to dashboard
- ✅ Admin-only routes require admin role

### Admin Panel
- ✅ Only accessible to super admins
- ✅ Can enable/disable modules for tenants
- ✅ Changes reflect immediately

---

## 🐛 Troubleshooting

### Issue: ModuleSwitcher not showing
**Solution:** 
- Check if `ModuleProvider` is in `app/providers.tsx`
- Verify user is logged in
- Check browser console for errors

### Issue: No modules appearing
**Solution:**
- Check tenant's `licensedModules` in database
- Verify `ENABLE_RBAC=true` if using RBAC
- Check user has permissions

### Issue: Route protection not working
**Solution:**
- Verify middleware is running (`middleware.ts`)
- Check token is valid
- Verify module is enabled for tenant

### Issue: Admin panel not accessible
**Solution:**
- Verify user has `super_admin` role
- Check token includes role
- Verify route is `/admin/*`

---

## ✅ Success Criteria

- [ ] ModuleSwitcher appears in header
- [ ] Can switch between enabled modules
- [ ] Route protection works correctly
- [ ] Admin panel accessible to super admins
- [ ] Module enablement works via admin panel
- [ ] Navigation updates when modules change

---

## 📝 Next Phase

Once Phase 2 is tested and working:
- **Phase 3:** SSO Implementation
- **Phase 4:** Advanced Features
