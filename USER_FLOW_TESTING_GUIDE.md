# PayAid V3 - User Flow Testing Guide
## Step-by-Step Testing Checklist for Live Site (Vercel)

**Date:** January 2026  
**Status:** ✅ Site Live on Vercel  
**Purpose:** Verify user flows match design specifications

---

## 🎯 Overview

This guide provides a comprehensive step-by-step flow to test your PayAid V3 application and verify it works as designed. Follow each section in order to ensure all user journeys function correctly.

---

## 📋 PRE-TESTING CHECKLIST

Before starting, ensure:
- [ ] Site is accessible on Vercel (check URL)
- [ ] Browser console is open (F12) to monitor errors
- [ ] Network tab is open to check API calls
- [ ] You have test credentials ready (or will create new account)
- [ ] Database is connected and accessible

---

## 🌐 FLOW 1: NEW USER REGISTRATION

### Step 1.1: Landing Page Visit
**URL:** `https://your-app.vercel.app/` (or your Vercel domain)

**Expected Behavior:**
- [ ] Landing page loads without errors
- [ ] Modern, professional design visible
- [ ] "Sign In" button visible (top right or hero section)
- [ ] "Get Started" or "Sign Up" button visible
- [ ] No console errors
- [ ] Page is responsive (test on mobile/tablet/desktop)

**What to Check:**
- Hero section displays correctly
- Feature highlights visible
- Pricing information (if shown)
- Navigation menu works
- Footer links present

**If Issues:**
- Check browser console for JavaScript errors
- Verify API endpoints are accessible
- Check network tab for failed requests

---

### Step 1.2: Navigate to Registration
**Action:** Click "Sign Up" or "Get Started" button

**Expected Behavior:**
- [ ] Redirects to `/register` or `/signup`
- [ ] Registration form displays
- [ ] Form fields visible:
  - Full Name
  - Email
  - Password
  - Business Name
  - Subdomain

**What to Check:**
- Form validation messages work
- Subdomain preview shows (e.g., `mycompany.payaid.com`)
- "Already have an account? Sign in" link works
- Back to home link works

---

### Step 1.3: Fill Registration Form
**Test Data:**
```
Full Name: Test User
Email: test@example.com (use unique email)
Password: Test1234! (min 8 characters)
Business Name: Test Company Pvt Ltd
Subdomain: testcompany (lowercase, no spaces)
```

**Expected Behavior:**
- [ ] Form accepts valid input
- [ ] Subdomain validation works (only lowercase, numbers, hyphens)
- [ ] Password strength indicator (if implemented)
- [ ] Real-time validation feedback

**What to Check:**
- Try invalid subdomain (spaces, uppercase) → should show error
- Try weak password → should show error
- Try invalid email → should show error
- All fields required → submit button disabled until filled

---

### Step 1.4: Submit Registration
**Action:** Click "Create account" button

**Expected Behavior:**
- [ ] Loading state shows ("Creating account...")
- [ ] API call to `/api/auth/register` succeeds
- [ ] Success response received
- [ ] User redirected to appropriate page

**Expected Redirect:**
- [ ] After registration → Redirects to `/home/[tenantId]` (module selection page)
- [ ] OR redirects to `/dashboard` (if legacy flow still exists)
- [ ] User is authenticated (check auth state)

**What to Check:**
- Network tab shows successful POST to `/api/auth/register`
- Response contains: `user`, `tenant`, `token`
- JWT token stored in cookies/localStorage
- No console errors
- Tenant ID is valid format

**If Issues:**
- Check API response in network tab
- Verify database connection
- Check if email already exists
- Verify subdomain is unique

---

## 🔐 FLOW 2: EXISTING USER LOGIN

### Step 2.1: Navigate to Login
**URL:** `https://your-app.vercel.app/login`

**Expected Behavior:**
- [ ] Login page loads
- [ ] Email and password fields visible
- [ ] "Sign in" button present
- [ ] "Don't have an account? Sign up" link works
- [ ] "Back to Home" link works

**What to Check:**
- Form is clean and professional
- Logo/branding visible
- Responsive design works

---

### Step 2.2: Enter Credentials
**Test Data:**
```
Email: test@example.com (use registered email)
Password: Test1234! (use correct password)
```

**Expected Behavior:**
- [ ] Form accepts input
- [ ] Password toggle (show/hide) works
- [ ] Auto-complete works (browser remembers credentials)

---

### Step 2.3: Submit Login
**Action:** Click "Sign in" button

**Expected Behavior:**
- [ ] Loading state shows ("Signing in...")
- [ ] API call to `/api/auth/login` succeeds
- [ ] Success response received
- [ ] User authenticated

**Expected Redirect:**
- [ ] **Primary:** Redirects to `/home/[tenantId]` (module selection page)
- [ ] **Alternative:** If redirect URL provided → redirects to that URL
- [ ] **Module-specific:** If coming from module page → redirects to module dashboard

**What to Check:**
- Network tab shows successful POST to `/api/auth/login`
- Response contains: `user`, `tenant`, `token`
- JWT token stored securely
- Tenant ID matches authenticated tenant
- No console errors

**If Wrong Credentials:**
- [ ] Error message displays: "Invalid email or password"
- [ ] Form remains on login page
- [ ] User can retry

---

## 🏠 FLOW 3: MODULE SELECTION (HOME PAGE)

### Step 3.1: Access Home Page
**URL:** `https://your-app.vercel.app/home/[tenantId]`

**Expected Behavior:**
- [ ] Home page loads
- [ ] Welcome message shows: "Welcome, [Business Name]"
- [ ] Module grid displays all available modules
- [ ] Header/navigation visible
- [ ] News sidebar visible (if implemented)

**What to Check:**
- Tenant name matches registered business
- All modules visible (CRM, Sales, Marketing, Finance, HR, etc.)
- Module cards show:
  - Module name
  - Description
  - Icon
  - Status (active/available)

**If Not Authenticated:**
- [ ] Redirects to `/login`
- [ ] Shows appropriate error message

---

### Step 3.2: View Available Modules
**Expected Modules (Core):**
- [ ] CRM
- [ ] Sales
- [ ] Marketing
- [ ] Finance & Accounting
- [ ] HR
- [ ] Projects
- [ ] Inventory
- [ ] Communication
- [ ] Analytics
- [ ] AI Co-founder
- [ ] AI Chat
- [ ] AI Insights
- [ ] Website Builder
- [ ] (And other modules as configured)

**What to Check:**
- Module cards are clickable
- Hover effects work
- Icons display correctly
- Descriptions are clear
- Grid layout is responsive

---

### Step 3.3: Click on a Module
**Action:** Click on "CRM" module card

**Expected Behavior:**
- [ ] Redirects to `/crm/[tenantId]/Home/`
- [ ] CRM dashboard loads
- [ ] Module-specific navigation visible
- [ ] Module content displays

**What to Check:**
- URL contains tenant ID
- Module loads without errors
- Navigation bar shows module-specific tabs
- Dashboard content is relevant to module

---

## 📊 FLOW 4: MODULE NAVIGATION (CRM Example)

### Step 4.1: Access CRM Module
**URL:** `https://your-app.vercel.app/crm/[tenantId]/Home/`

**Expected Behavior:**
- [ ] CRM dashboard loads
- [ ] Top navigation bar visible with:
  - Module logo/name (CRM)
  - Navigation tabs: Home, Leads, Contacts, Accounts, Deals, Tasks, Reports, Settings
  - Module switcher dropdown
  - User profile menu

**What to Check:**
- Navigation tabs are clickable
- Current tab (Home) is highlighted
- Module switcher shows available modules
- User menu shows profile/logout options

---

### Step 4.2: Navigate Between Module Tabs
**Actions:**
1. Click "Leads" tab
2. Click "Contacts" tab
3. Click "Deals" tab
4. Click "Reports" tab

**Expected Behavior:**
- [ ] Each tab navigates to correct route:
  - Leads → `/crm/[tenantId]/Leads`
  - Contacts → `/crm/[tenantId]/Contacts`
  - Deals → `/crm/[tenantId]/Deals`
  - Reports → `/crm/[tenantId]/Reports`
- [ ] Page content updates
- [ ] Active tab highlights correctly
- [ ] No page reload (smooth navigation)

**What to Check:**
- URL updates correctly
- Content loads for each section
- No console errors
- Loading states show (if data fetching)

---

### Step 4.3: Use Module Switcher
**Action:** Click module switcher dropdown (top navigation)

**Expected Behavior:**
- [ ] Dropdown opens
- [ ] Shows all available modules
- [ ] Current module highlighted
- [ ] Modules user has access to are enabled
- [ ] Modules user doesn't have access to are disabled/grayed out

**Action:** Click on "Finance" module

**Expected Behavior:**
- [ ] Redirects to `/finance/[tenantId]/Home/`
- [ ] Finance module loads
- [ ] Navigation updates to Finance tabs
- [ ] Content is Finance-specific

**What to Check:**
- Smooth transition between modules
- Authentication persists (no re-login required)
- Tenant context maintained
- Module-specific features load correctly

---

## 🔄 FLOW 5: CROSS-MODULE NAVIGATION

### Step 5.1: Navigate from CRM to Finance
**Starting Point:** `/crm/[tenantId]/Home/`

**Action:** Use module switcher to go to Finance

**Expected Behavior:**
- [ ] Redirects to `/finance/[tenantId]/Home/`
- [ ] Finance dashboard loads
- [ ] Finance-specific navigation visible
- [ ] User remains authenticated

---

### Step 5.2: Navigate from Finance to Marketing
**Starting Point:** `/finance/[tenantId]/Home/`

**Action:** Use module switcher to go to Marketing

**Expected Behavior:**
- [ ] Redirects to `/marketing/[tenantId]/Home/`
- [ ] Marketing dashboard loads
- [ ] Marketing-specific navigation visible
- [ ] User remains authenticated

---

### Step 5.3: Return to Home (Module Selection)
**Action:** Click "Home" in module switcher or navigate to `/home/[tenantId]`

**Expected Behavior:**
- [ ] Returns to module selection page
- [ ] All modules visible
- [ ] Can select any module again

---

## 🚪 FLOW 6: LOGOUT & SESSION MANAGEMENT

### Step 6.1: Logout from Module
**Action:** Click user profile menu → "Sign out" or "Logout"

**Expected Behavior:**
- [ ] Logout API call succeeds (`/api/auth/logout`)
- [ ] Session cleared
- [ ] JWT token removed
- [ ] Redirects to landing page (`/`) or login page (`/login`)

**What to Check:**
- Network tab shows successful logout request
- Cookies/localStorage cleared
- Cannot access protected routes after logout
- Redirects correctly

---

### Step 6.2: Access Protected Route After Logout
**Action:** Try to access `/home/[tenantId]` or any module directly

**Expected Behavior:**
- [ ] Redirects to `/login`
- [ ] Shows appropriate message (if implemented)
- [ ] Cannot access protected content

---

### Step 6.3: Session Persistence
**Action:** Login → Close browser → Reopen → Navigate to site

**Expected Behavior:**
- [ ] If token stored in httpOnly cookies → User remains logged in
- [ ] If token in localStorage → User remains logged in (if not expired)
- [ ] If token expired → Redirects to login

**What to Check:**
- Token expiration handling
- Refresh token mechanism (if implemented)
- Auto-logout on token expiry

---

## 🎨 FLOW 7: UI/UX VERIFICATION

### Step 7.1: Design System Compliance
**Check Each Page:**
- [ ] Colors match design system:
  - Primary: #0F766E (Deep Teal)
  - Secondary: #0284C7 (Vibrant Blue)
  - Success: #059669
  - Error: #DC2626
- [ ] Typography follows hierarchy (Inter font family)
- [ ] Spacing uses 8px grid system
- [ ] Icons are consistent (Heroicons outline, 24px)
- [ ] Buttons have proper styling and hover effects
- [ ] Cards have proper shadows and borders

---

### Step 7.2: Responsive Design
**Test on Different Screen Sizes:**
- [ ] Mobile (320px - 640px): Single column, stacked layout
- [ ] Tablet (768px - 1024px): 2-column grid
- [ ] Desktop (1024px+): Full layout with sidebar/navigation
- [ ] Large Desktop (1440px+): Optimal spacing

**What to Check:**
- No horizontal scroll
- Touch targets ≥44px on mobile
- Navigation adapts (hamburger menu on mobile)
- Forms are usable on all sizes
- Tables scroll horizontally on mobile (if needed)

---

### Step 7.3: Animations & Micro-interactions
**Check:**
- [ ] Page transitions are smooth (150-300ms)
- [ ] Button hover effects work
- [ ] Loading states show (spinners/skeletons)
- [ ] Modal/dialog animations work
- [ ] Form validation feedback is immediate
- [ ] Success/error messages animate in

---

## 🔍 FLOW 8: ERROR HANDLING

### Step 8.1: Invalid Routes
**Actions:**
1. Navigate to `/invalid-route`
2. Navigate to `/crm/invalid-tenant/Home/`
3. Navigate to `/crm/[tenantId]/InvalidTab`

**Expected Behavior:**
- [ ] 404 page displays (if implemented)
- [ ] OR redirects to appropriate page
- [ ] Error message is user-friendly
- [ ] No console errors (handled gracefully)

---

### Step 8.2: API Errors
**Actions:**
1. Disconnect internet → Try to load module
2. Use invalid credentials → Try to login
3. Access module without permission

**Expected Behavior:**
- [ ] Network error shows user-friendly message
- [ ] Invalid credentials show error message
- [ ] Permission denied shows appropriate message
- [ ] Error states are clear and actionable

---

### Step 8.3: Form Validation Errors
**Actions:**
1. Submit empty registration form
2. Submit login with invalid email format
3. Submit registration with weak password

**Expected Behavior:**
- [ ] Field-level validation shows errors
- [ ] Error messages are clear
- [ ] Form doesn't submit with errors
- [ ] Errors clear when fixed

---

## 📱 FLOW 9: MOBILE-SPECIFIC TESTING

### Step 9.1: Mobile Navigation
**Action:** Open site on mobile device (or browser dev tools mobile view)

**Expected Behavior:**
- [ ] Hamburger menu visible (if implemented)
- [ ] Navigation collapses on mobile
- [ ] Touch targets are large enough (≥44px)
- [ ] Forms are easy to fill on mobile
- [ ] Module cards are tappable

---

### Step 9.2: Mobile Module Access
**Action:** Navigate through modules on mobile

**Expected Behavior:**
- [ ] Module switcher works on mobile
- [ ] Module tabs are accessible
- [ ] Content is readable
- [ ] No horizontal scroll issues

---

## ✅ FLOW 10: COMPLETE USER JOURNEY

### Full Journey Test:
1. [ ] **Landing Page** → Visit homepage
2. [ ] **Registration** → Create new account
3. [ ] **Module Selection** → See all available modules
4. [ ] **Module Access** → Click on CRM module
5. [ ] **Module Navigation** → Navigate between CRM tabs
6. [ ] **Cross-Module** → Switch to Finance module
7. [ ] **Module Features** → Use module-specific features
8. [ ] **Logout** → Sign out
9. [ ] **Re-login** → Sign back in
10. [ ] **Session** → Verify session persistence

---

## 🐛 COMMON ISSUES TO WATCH FOR

### Authentication Issues:
- [ ] Token not stored correctly
- [ ] Token expires too quickly
- [ ] Logout doesn't clear session
- [ ] Redirect loops after login

### Routing Issues:
- [ ] Wrong redirect after login
- [ ] Module routes not accessible
- [ ] Tenant ID missing in URL
- [ ] 404 errors on valid routes

### UI Issues:
- [ ] Design system not followed
- [ ] Responsive layout breaks
- [ ] Animations not smooth
- [ ] Loading states missing

### API Issues:
- [ ] API calls fail silently
- [ ] Error messages not user-friendly
- [ ] Data not loading
- [ ] CORS errors (if applicable)

---

## 📊 TESTING CHECKLIST SUMMARY

### Critical Flows (Must Work):
- [ ] ✅ User Registration
- [ ] ✅ User Login
- [ ] ✅ Module Selection (Home Page)
- [ ] ✅ Module Access
- [ ] ✅ Cross-Module Navigation
- [ ] ✅ Logout

### Important Flows (Should Work):
- [ ] ✅ Session Persistence
- [ ] ✅ Error Handling
- [ ] ✅ Responsive Design
- [ ] ✅ Form Validation

### Nice-to-Have (Optional):
- [ ] ✅ Animations
- [ ] ✅ Loading States
- [ ] ✅ Empty States
- [ ] ✅ Success Messages

---

## 📝 NOTES & OBSERVATIONS

**Document any issues found:**

1. **Issue:** [Description]
   - **Location:** [URL/Page]
   - **Steps to Reproduce:** [Steps]
   - **Expected:** [What should happen]
   - **Actual:** [What actually happens]
   - **Severity:** [Critical/High/Medium/Low]

2. **Issue:** [Description]
   - ...

---

## 🎯 NEXT STEPS AFTER TESTING

1. **Document Findings:** Create a list of all issues found
2. **Prioritize Issues:** Critical → High → Medium → Low
3. **Fix Issues:** Address critical issues first
4. **Re-test:** Verify fixes work
5. **User Acceptance:** Get stakeholder approval

---

## 📞 SUPPORT

If you encounter issues during testing:
- Check browser console for errors
- Check network tab for failed requests
- Verify environment variables are set
- Check database connectivity
- Review API logs (if available)

---

**Last Updated:** January 2026  
**Version:** 1.0  
**Status:** Ready for Testing
