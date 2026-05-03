# PayAid V3 - Quick User Flow Checklist
## Fast Testing Reference for Live Site

**Use this for quick verification. For detailed testing, see `USER_FLOW_TESTING_GUIDE.md`**

---

## 🚀 QUICK TEST (5 Minutes)

### 1. Landing Page → Registration → Login → Module Access

```
✅ Visit: https://your-app.vercel.app/
✅ Click "Sign Up" → Fill form → Submit
✅ Should redirect to: /home/[tenantId]
✅ Click "CRM" module
✅ Should redirect to: /crm/[tenantId]/Home/
✅ Navigate tabs: Leads, Contacts, Deals
✅ Use module switcher → Go to Finance
✅ Should redirect to: /finance/[tenantId]/Home/
✅ Logout → Should redirect to landing page
✅ Login again → Should redirect to /home/[tenantId]
```

---

## 📋 DETAILED CHECKLIST

### ✅ AUTHENTICATION FLOW

#### Registration
- [ ] Landing page loads (`/`)
- [ ] Click "Sign Up" → Goes to `/register`
- [ ] Fill form (name, email, password, business, subdomain)
- [ ] Submit → Creates account
- [ ] Redirects to `/home/[tenantId]` (module selection)

#### Login
- [ ] Go to `/login`
- [ ] Enter credentials
- [ ] Submit → Authenticates
- [ ] Redirects to `/home/[tenantId]` (or intended URL)

#### Logout
- [ ] Click user menu → "Sign out"
- [ ] Session cleared
- [ ] Redirects to `/` or `/login`

---

### ✅ MODULE SELECTION (HOME PAGE)

#### Access Home
- [ ] URL: `/home/[tenantId]`
- [ ] Shows welcome message with business name
- [ ] Module grid displays all modules
- [ ] Each module card is clickable

#### Module Cards Visible
- [ ] CRM
- [ ] Sales
- [ ] Marketing
- [ ] Finance
- [ ] HR
- [ ] Projects
- [ ] Inventory
- [ ] (Other modules as configured)

---

### ✅ MODULE NAVIGATION

#### CRM Module
- [ ] Click CRM → Goes to `/crm/[tenantId]/Home/`
- [ ] Top nav shows: Home, Leads, Contacts, Accounts, Deals, Tasks, Reports
- [ ] Click "Leads" → Goes to `/crm/[tenantId]/Leads`
- [ ] Click "Contacts" → Goes to `/crm/[tenantId]/Contacts`
- [ ] Click "Deals" → Goes to `/crm/[tenantId]/Deals`
- [ ] Module switcher dropdown works

#### Finance Module
- [ ] Use switcher → Go to Finance
- [ ] URL: `/finance/[tenantId]/Home/`
- [ ] Finance-specific navigation visible
- [ ] Content loads correctly

#### Marketing Module
- [ ] Use switcher → Go to Marketing
- [ ] URL: `/marketing/[tenantId]/Home/`
- [ ] Marketing-specific navigation visible
- [ ] Content loads correctly

---

### ✅ CROSS-MODULE NAVIGATION

- [ ] From CRM → Switch to Finance → Works
- [ ] From Finance → Switch to Marketing → Works
- [ ] From Marketing → Switch to HR → Works
- [ ] From any module → Go to Home → Works
- [ ] Authentication persists across modules
- [ ] Tenant context maintained

---

### ✅ UI/UX VERIFICATION

#### Design System
- [ ] Colors match (Teal #0F766E, Blue #0284C7)
- [ ] Typography consistent (Inter font)
- [ ] Spacing uses 8px grid
- [ ] Icons consistent (24px, outline style)
- [ ] Buttons have hover effects
- [ ] Cards have proper shadows

#### Responsive
- [ ] Mobile (320px): Works
- [ ] Tablet (768px): Works
- [ ] Desktop (1024px+): Works
- [ ] No horizontal scroll

#### Animations
- [ ] Page transitions smooth
- [ ] Button hover effects
- [ ] Loading states show
- [ ] Form validation feedback

---

### ✅ ERROR HANDLING

- [ ] Invalid route → 404 or redirect
- [ ] Invalid credentials → Error message
- [ ] Network error → User-friendly message
- [ ] Form validation → Field errors show
- [ ] Permission denied → Appropriate message

---

### ✅ SESSION MANAGEMENT

- [ ] Login persists after page refresh
- [ ] Token stored securely
- [ ] Logout clears session
- [ ] Protected routes redirect if not authenticated
- [ ] Token expiry handled gracefully

---

## 🎯 EXPECTED URL PATTERNS

### Public Routes
```
/                    → Landing page
/login               → Login page
/register            → Registration page
/signup              → Signup page (if different)
```

### Authenticated Routes
```
/home/[tenantId]                    → Module selection (home)
/crm/[tenantId]/Home/               → CRM dashboard
/crm/[tenantId]/Leads               → CRM Leads
/crm/[tenantId]/Contacts            → CRM Contacts
/crm/[tenantId]/Deals               → CRM Deals
/finance/[tenantId]/Home/            → Finance dashboard
/marketing/[tenantId]/Home/         → Marketing dashboard
/hr/[tenantId]/Home/                 → HR dashboard
/sales/[tenantId]/Home/              → Sales dashboard
/projects/[tenantId]/Home/           → Projects dashboard
/inventory/[tenantId]/Home/          → Inventory dashboard
```

---

## 🐛 QUICK ISSUE CHECKLIST

### If Registration Fails:
- [ ] Check email is unique
- [ ] Check subdomain is unique
- [ ] Check password meets requirements
- [ ] Check API endpoint is accessible
- [ ] Check database connection

### If Login Fails:
- [ ] Check credentials are correct
- [ ] Check API endpoint is accessible
- [ ] Check token is being stored
- [ ] Check redirect URL is correct

### If Module Doesn't Load:
- [ ] Check tenant ID in URL
- [ ] Check user has access to module
- [ ] Check module route exists
- [ ] Check authentication is valid

### If Navigation Fails:
- [ ] Check URL format is correct
- [ ] Check tenant ID matches
- [ ] Check module route exists
- [ ] Check authentication persists

---

## 📊 TESTING PRIORITY

### 🔴 Critical (Must Work)
1. User Registration
2. User Login
3. Module Selection (Home)
4. Module Access (CRM, Finance, etc.)
5. Logout

### 🟡 Important (Should Work)
1. Cross-module navigation
2. Module tab navigation
3. Session persistence
4. Error handling
5. Responsive design

### 🟢 Nice-to-Have (Optional)
1. Animations
2. Loading states
3. Empty states
4. Success messages

---

## ✅ FINAL VERIFICATION

**Complete this flow without errors:**
```
1. Visit landing page
2. Register new account
3. See module selection page
4. Access CRM module
5. Navigate CRM tabs
6. Switch to Finance module
7. Switch to Marketing module
8. Return to home
9. Logout
10. Login again
11. Access module directly
```

**If all steps work → Site is functioning correctly! ✅**

---

**Quick Reference Version 1.0** | January 2026
