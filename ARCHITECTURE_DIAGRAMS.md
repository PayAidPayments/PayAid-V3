# PayAid V3 - Visual Architecture Diagrams
## Complete System Flow Diagrams

---

## 1. USER JOURNEY DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PAYAID V3 USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────────────────┘

                           FIRST TIME VISITOR
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
            payaid.io/landing         payaid.io/products
                    │                           │
              Sees mega menu          Sees all 6 products
              Clicks CRM              Clicks CRM
                    │                           │
                    └─────────────┬─────────────┘
                                  ▼
                          payaid.io/crm
                    (CRM Marketing Page)
                       Sees features
                    "Get Started" button
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
            Already have               Don't have account
            account? (click            (click "Sign Up")
            "Sign In")                       │
                    │                        ▼
                    │               payaid.io/signup
                    │               Create account:
                    │               - Email
                    │               - Password
                    │               - First name
                    │               - Last name
                    │                        │
                    ├─────────────┬──────────┘
                    ▼             ▼
            payaid.io/login   JWT created
            Enter credentials  httpOnly cookie
                    │           stored
                    ▼
            JWT validated
                    │
                    ▼
            ┌──────────────────────────────────┐
            │    REDIRECT TO: /app/page.tsx     │
            │    (Dashboard - First Entry)      │
            └──────────────────────────────────┘
                    │
      ┌─────────────┴──────────────┬──────────────┐
      ▼                            ▼              ▼
   Sidebar           Main Content         Top Bar
   ├─ CRM            Dashboard           - Search
   ├─ Settings       Cards with          - Settings
   └─ + Add             quick stats      - Notifications
      Modules        - Welcome msg       - App Switcher
                     - Recent activity   - Profile menu

                    USER CLICKS CRM TAB
                          │
                          ▼
          /app/crm/page.tsx (Home/Dashboard)
          ├─ CRM home dashboard
          ├─ Quick stats (e.g., 5 open deals)
          ├─ Recent leads
          └─ Upcoming meetings

                 USER CLICKS "LEADS" TAB
                          │
                          ▼
         /app/crm/leads/page.tsx (List View)
         Left panel: Filters, saved views
         Center: Leads list with columns
         ├─ Checkbox
         ├─ Status (colored badge)
         ├─ Last activity
         ├─ Name
         ├─ Email
         ├─ Phone
         └─ ... more columns

                USER CLICKS "CREATE LEAD"
                          │
                          ▼
        /app/crm/leads/create/page.tsx
        Form with fields:
        ├─ First name * (mandatory)
        ├─ Last name * (mandatory)
        ├─ Email
        ├─ Phone
        ├─ Lead Status * (mandatory)
        └─ ... more fields

                    USER SUBMITS FORM
                          │
        ┌──────────────────┴──────────────────┐
        ▼                                      ▼
    Validation passes              Validation fails
        │                               │
        ▼                               ▼
    POST /api/crm/leads          Show error messages
    Save to database             Highlight required fields
        │                               │
        ▼                               ▼
    Success toast            User fixes and resubmits
        │
        ▼
    Redirect to /app/crm/leads/[id]
    Show newly created lead detail page


                ADMIN USER - SPECIAL FLOW

              /app/settings/admin/users
              - Can see all users
              - Can assign modules to users
              - Can change user roles

              /app/settings/admin/field-config
              - Can define which fields are mandatory
              - Can hide/show fields
              - Can reorder fields
              - Configuration applies to all users' forms
```

---

## 2. DATABASE RELATIONSHIPS

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA DIAGRAM                               │
└──────────────────────────────────────────────────────────────────────────────┘


Organization (1)
    ├─ id
    ├─ name
    ├─ logo
    ├─ timezone
    └─ currency
        │
        ├─────────────────────────┬──────────────────────┬─────────────────────┐
        │                         │                      │                     │
        ▼                         ▼                      ▼                     ▼
    User (*)              Module (*)            FieldConfiguration (*)    AuditLog (*)
    ├─ id                 ├─ id                 ├─ id                    ├─ id
    ├─ email              ├─ moduleType         ├─ moduleType            ├─ userId
    ├─ password_hash      ├─ isActive           ├─ recordType            ├─ action
    ├─ firstName                                ├─ action (create/edit)  ├─ entityType
    ├─ lastName                                 ├─ fields (JSON)         ├─ entityId
    ├─ role (admin|user)                        │   ├─ name              ├─ oldValues
    ├─ assignedModules                          │   ├─ label             ├─ newValues
    │   (JSON array)                            │   ├─ type              └─ timestamp
    ├─ createdAt                                │   ├─ required
    └─ updatedAt                                │   ├─ visible
                                                │   └─ order
                                                └─ updatedAt

                            RefreshToken (*)
                            ├─ id
                            ├─ userId (FK→User)
                            ├─ token
                            └─ expiresAt

        ┌────────────────────────┬────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
    Lead (*)               Invoice (*)              [Future modules...]
    ├─ id                  ├─ id                    ├─ id
    ├─ firstName           ├─ invoiceNumber        ├─ data
    ├─ lastName            ├─ amount               └─ ...
    ├─ email               ├─ dueDate
    ├─ phone               ├─ customerId
    ├─ company             ├─ status
    ├─ leadSource          └─ updatedAt
    ├─ leadStatus
    ├─ leadOwnerId (FK→User)
    └─ updatedAt


RELATIONSHIPS:
- Organization (1) → (many) User
- Organization (1) → (many) Module
- Organization (1) → (many) FieldConfiguration
- Organization (1) → (many) AuditLog
- Organization (1) → (many) Lead
- Organization (1) → (many) Invoice
- User (1) → (many) RefreshToken
- User (1) → (many) AuditLog (as userId)
```

---

## 3. AUTHENTICATION FLOW

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       AUTHENTICATION FLOW DIAGRAM                             │
└──────────────────────────────────────────────────────────────────────────────┘


USER SIGNUP FLOW:
═════════════════

User visits /signup
        │
        ▼
User enters:
├─ First name
├─ Last name
├─ Email
└─ Password
        │
        ▼
User clicks "Sign Up"
        │
        ▼
POST /api/auth/signup
        │
        ├─── Validate input (zod)
        │
        ├─── Check email doesn't exist in DB
        │
        ├─── Hash password with bcrypt
        │         │
        │         └─ hashedPassword = await bcryptjs.hash(password, 10)
        │
        ├─── Create User record in DB:
        │    ├─ email
        │    ├─ password_hash
        │    ├─ firstName
        │    ├─ lastName
        │    ├─ role: 'user'
        │    └─ assignedModules: []
        │
        ├─── Create Organization for user
        │
        ├─── Generate JWT token:
        │    {
        │      userId: user.id
        │      email: user.email
        │      organizationId: org.id
        │      role: 'user'
        │      assignedModules: []
        │      iat: Date.now()
        │      exp: Date.now() + 24h
        │    }
        │
        ├─── Store JWT in httpOnly cookie
        │         │
        │         └─ cookies.set('payaid_token', token, {
        │            httpOnly: true,
        │            secure: true,
        │            sameSite: 'strict',
        │            maxAge: 86400 (24 hours)
        │         })
        │
        ├─── Return: { success: true, user: {...} }
        │
        ▼
Browser receives response
        │
        ▼
Redirect to /app (Dashboard)
        │
        ▼
Middleware checks for JWT cookie
        │
        ├─── JWT found ✓
        │
        ├─── Verify JWT signature
        │
        └─── User logged in, access granted


USER LOGIN FLOW:
════════════════

User visits /login
        │
        ▼
User enters:
├─ Email
└─ Password
        │
        ▼
User clicks "Sign In"
        │
        ▼
POST /api/auth/login
        │
        ├─── Validate input
        │
        ├─── Find user by email in DB
        │
        ├─── If not found → Return 401 "Invalid credentials"
        │
        ├─── If found, compare password:
        │    const match = await bcryptjs.compare(
        │      inputPassword,
        │      user.password_hash
        │    )
        │
        ├─── If password doesn't match → Return 401 "Invalid credentials"
        │
        ├─── If password matches:
        │
        ├─── Generate JWT with user's actual assignedModules
        │    {
        │      userId: user.id
        │      email: user.email
        │      organizationId: user.organizationId
        │      role: user.role  (admin or user)
        │      assignedModules: user.assignedModules  (from DB)
        │      iat: Date.now()
        │      exp: Date.now() + 24h
        │    }
        │
        ├─── Store JWT in httpOnly cookie
        │
        ├─── Return: { success: true, user: {...}, assignedModules: [...] }
        │
        ▼
Browser stores JWT in cookie (automatic)
        │
        ▼
Redirect to /app
        │
        ▼
Middleware verifies JWT
        │
        └─── User logged in with their assigned modules


PROTECTED REQUEST FLOW:
═══════════════════════

User makes request to /api/crm/leads (GET request)
        │
        ▼
middleware.ts executes:
        │
        ├─── Extract JWT from cookie
        │
        ├─── Verify JWT signature
        │
        ├─── If invalid → Return 401, redirect to /login
        │
        ├─── If valid:
        │    ├─ Decode JWT
        │    ├─ Extract userId, organizationId, role, assignedModules
        │    └─ Attach to request headers
        │
        ▼
API route /api/crm/leads executes:
        │
        ├─── Read user from request headers
        │
        ├─── Check if 'crm' in user.assignedModules
        │    ├─ If NOT in assignedModules → Return 403 "Access denied"
        │    └─ If in assignedModules → Continue
        │
        ├─── Query database for leads:
        │    WHERE organizationId = user.organizationId
        │
        ├─── Return leads list
        │
        ▼
Response sent to browser with leads data


LOGOUT FLOW:
════════════

User clicks "Logout"
        │
        ▼
POST /api/auth/logout
        │
        ├─── Clear JWT cookie:
        │    cookies.delete('payaid_token')
        │
        ├─── Return: { success: true }
        │
        ▼
Browser clears cookie (automatic)
        │
        ▼
Redirect to /login
        │
        ▼
Next request to /app:
        │
        └─── No JWT in cookie → Redirect to /login
```

---

## 4. MODULE ACCESS CONTROL

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      MODULE ACCESS CONTROL FLOW                               │
└──────────────────────────────────────────────────────────────────────────────┘


SIDEBAR RENDERING (app/components/Sidebar.tsx):
════════════════════════════════════════════════

GET user.assignedModules from JWT
        │
        ├─── If user is ADMIN:
        │    Show all 6 modules:
        │    ├─ CRM
        │    ├─ Invoicing
        │    ├─ Accounting
        │    ├─ HR
        │    ├─ WhatsApp
        │    ├─ Analytics
        │    ├─ Settings
        │    └─ Admin Panel
        │
        └─── If user is REGULAR USER:
             Example: assignedModules = ['crm', 'invoicing']
             Show only assigned modules:
             ├─ CRM
             ├─ Invoicing
             ├─ Settings
             └─ + Add Modules (link to app-store)


ACCESSING A MODULE (e.g., /app/crm):
═════════════════════════════════════

User clicks "CRM" in sidebar
        │
        ▼
Navigate to /app/crm
        │
        ▼
middleware.ts checks:
        │
        ├─── JWT valid? ✓
        │
        ├─── Get user.assignedModules from JWT
        │
        ├─── Check if 'crm' in assignedModules
        │    ├─ YES → Continue to /app/crm page
        │    └─ NO → Redirect to /app with error "Module not available"
        │
        ▼
Page renders /app/crm with data


ADMIN ACCESS TO ADMIN PANEL:
═════════════════════════════

User clicks "Admin Panel" (only visible if admin)
        │
        ▼
Navigate to /app/settings/admin
        │
        ▼
lib/adminOnly.ts middleware checks:
        │
        ├─── JWT valid? ✓
        │
        ├─── Check user.role === 'admin'
        │    ├─ YES → Continue to admin page
        │    └─ NO → Redirect to /app with error "Access denied"
        │
        ▼
Admin page renders


MODULE ASSIGNMENT BY ADMIN:
════════════════════════════

Admin navigates to /app/settings/admin/users
        │
        ▼
Admin clicks "Edit" on a user
        │
        ▼
Admin sees checkboxes for:
├─ CRM (checked)
├─ Invoicing (unchecked)
├─ Accounting (unchecked)
├─ HR (checked)
├─ WhatsApp (unchecked)
└─ Analytics (unchecked)
        │
        ▼
Admin checks "Invoicing" and "Analytics"
        │
        ▼
Admin clicks "Save"
        │
        ▼
PUT /api/admin/users/[userId]
{
  assignedModules: ['crm', 'hr', 'invoicing', 'analytics']
}
        │
        ├─── Middleware checks: admin.role === 'admin' ✓
        │
        ├─── Update User.assignedModules in DB
        │
        └─── Return success
        │
        ▼
Next time user logs in:
        │
        ├─── JWT includes new assignedModules
        │
        ├─── Sidebar shows 4 modules instead of 2
        │
        └─── User can now access Invoicing and Analytics
```

---

## 5. ADMIN FIELD CONFIGURATION FLOW

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                   ADMIN FIELD CONFIGURATION FLOW                              │
└──────────────────────────────────────────────────────────────────────────────┘


ADMIN DEFINES MANDATORY FIELDS:
═════════════════════════════════

Admin navigates to:
/app/settings/admin/field-config
        │
        ▼
Admin selects:
├─ Module: CRM
├─ Record Type: Lead
└─ Action: Create
        │
        ▼
Page shows field editor:
        │
        Left panel:
        ├─ All available fields
        │  ├─ First Name
        │  ├─ Last Name
        │  ├─ Email
        │  ├─ Phone
        │  ├─ Company
        │  ├─ Lead Source
        │  └─ ... more fields
        │
        Right panel:
        ├─ Currently shown fields (draggable)
        │  ├─ First Name
        │  │  ├─ Required: ☑️ (checked)
        │  │  ├─ Visible: ☑️ (checked)
        │  │  └─ Order: 1
        │  │
        │  ├─ Last Name
        │  │  ├─ Required: ☑️ (checked)
        │  │  ├─ Visible: ☑️ (checked)
        │  │  └─ Order: 2
        │  │
        │  ├─ Email
        │  │  ├─ Required: ☐ (unchecked)
        │  │  ├─ Visible: ☑️ (checked)
        │  │  └─ Order: 3
        │  │
        │  ├─ Lead Source
        │  │  ├─ Required: ☑️ (checked)
        │  │  ├─ Visible: ☑️ (checked)
        │  │  └─ Order: 4
        │
        Admin makes changes:
        ├─ Check "Required" for First Name (red asterisk on form)
        ├─ Check "Required" for Last Name
        ├─ Check "Required" for Lead Source
        ├─ Uncheck "Required" for Email
        ├─ Drag to reorder: Lead Source → Position 3
        └─ Click "Save"
        │
        ▼
POST /api/admin/field-config
{
  module: 'crm',
  recordType: 'lead',
  action: 'create',
  fields: [
    { name: 'firstName', label: 'First Name', type: 'text', required: true, visible: true, order: 1 },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true, visible: true, order: 2 },
    { name: 'leadSource', label: 'Lead Source', type: 'dropdown', required: true, visible: true, order: 3 },
    { name: 'email', label: 'Email', type: 'email', required: false, visible: true, order: 4 },
    ...
  ]
}
        │
        ├─── Middleware: admin.role === 'admin' ✓
        │
        ├─── Save to FieldConfiguration table
        │
        └─── Return: { success: true }


USER CREATES FORM (Uses admin config):
════════════════════════════════════════

Regular user navigates to:
/app/crm/leads/create
        │
        ▼
Page loads, calls API:
GET /api/field-config?module=crm&action=create
        │
        ├─── Server queries FieldConfiguration table:
        │    SELECT * FROM FieldConfiguration
        │    WHERE module='crm' AND action='create'
        │
        ├─── Returns:
        │    {
        │      fields: [
        │        { name: 'firstName', label: 'First Name', type: 'text', required: true, visible: true },
        │        { name: 'lastName', label: 'Last Name', type: 'text', required: true, visible: true },
        │        { name: 'leadSource', label: 'Lead Source', type: 'dropdown', required: true, visible: true },
        │        { name: 'email', label: 'Email', type: 'email', required: false, visible: true },
        │        ...
        │      ],
        │      mandatory: ['firstName', 'lastName', 'leadSource']
        │    }
        │
        ▼
Form renders only visible fields:
        │
        ├─ First Name * (red asterisk = required)
        ├─ Last Name * (red asterisk = required)
        ├─ Lead Source * (red asterisk = required)
        ├─ Email (no asterisk = optional)
        └─ ... other visible fields
        │
        ▼
User submits form:
POST /api/crm/leads
{
  firstName: 'John',
  lastName: 'Doe',
  leadSource: 'Web Search',
  email: 'john@example.com'
}
        │
        ├─── API validates mandatory fields:
        │    mandatory = ['firstName', 'lastName', 'leadSource']
        │    if (!body.firstName) return 400 "First Name is required"
        │    if (!body.lastName) return 400 "Last Name is required"
        │    if (!body.leadSource) return 400 "Lead Source is required"
        │
        ├─── All mandatory fields present ✓
        │
        ├─── Save to Lead table
        │
        └─── Return: { id: 123, ... }


IF ADMIN CHANGES CONFIG LATER:
═══════════════════════════════

Admin adds "Company" as required field
        │
        ▼
Saves new config
        │
        ▼
NEXT TIME user creates lead:
        │
        ├─── Form loads with new config
        ├─── "Company" now shows with red asterisk
        └─── User must fill Company field
        │
        ▼
This affects ALL users' forms immediately
No code changes needed - purely admin configuration
```

---

## 6. MODULE SWITCHER SSO FLOW

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       MODULE SWITCHER SSO FLOW                                │
└──────────────────────────────────────────────────────────────────────────────┘


USER IN CRM MODULE:
═══════════════════

User viewing CRM leads
/app/crm/leads
        │
        ▼
User clicks grid icon (top right) in top bar
        │
        ▼
ModuleSwitcher popup appears showing:
        │
        ├─ CRM (current module, highlighted)
        ├─ Invoicing (available)
        ├─ Accounting (available)
        └─ Settings
        │
        ▼
User clicks "Invoicing"
        │
        ▼
Navigate to /app/invoicing
        │
        ├─── JWT already in httpOnly cookie
        │    (browser sends automatically with all requests)
        │
        ├─── middleware.ts verifies JWT
        │
        ├─── Check: 'invoicing' in user.assignedModules
        │    ✓ YES (admin or user has invoicing assigned)
        │
        └─── Grant access to /app/invoicing
        │
        ▼
Invoicing module page loads
        │
        ├─ No login required
        ├─ No password prompt
        ├─ User just "switched" to invoicing
        ├─ Session maintained
        └─ JWT is still valid
        │
        ▼
User is now in Invoicing module
/app/invoicing/home
        │
        ├─ Can see Invoicing tabs
        ├─ Can create invoices
        ├─ Can view invoices
        └─ Everything works seamlessly


COMPARISON: With old Zoho-style lock badges:
═════════════════════════════════════════════

WRONG (what we were trying to avoid):
├─ CRM ✓
├─ Invoicing ✓
├─ Accounting 🔒
├─ HR 🔒
├─ WhatsApp 🔒
└─ Analytics 🔒

User sees locked modules but can't access them
❌ Cluttered UI
❌ Confusing
❌ Not professional


CORRECT (what we're building):
═════════════════════════════

├─ CRM
├─ Invoicing
├─ Settings
└─ + Add Modules

✅ Clean UI
✅ Professional
✅ Clear upgrade path
✅ Matches Zoho exactly
```

---

## 7. COMPLETE SYSTEM ARCHITECTURE DIAGRAM

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      COMPLETE SYSTEM ARCHITECTURE                             │
└──────────────────────────────────────────────────────────────────────────────┘


                            ┌──────────────────────┐
                            │    USER BROWSER      │
                            └──────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │  PUBLIC      │  │  PRIVATE     │  │   ADMIN      │
            │  SITE        │  │  APP         │  │   PANEL      │
            ├──────────────┤  ├──────────────┤  ├──────────────┤
            │ / (landing)  │  │ /app/*       │  │ /app/        │
            │ /products    │  │              │  │ settings/    │
            │ /crm (etc.)  │  │              │  │ admin/*      │
            │ /login       │  │ Requires:    │  │              │
            │ /signup      │  │ - Valid JWT  │  │ Requires:    │
            │              │  │ - Module     │  │ - Valid JWT  │
            │ No auth      │  │   access     │  │ - Admin role │
            │ required     │  │              │  │              │
            └──────────────┘  └──────────────┘  └──────────────┘
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      │
                    ┌─────────────────▼─────────────────┐
                    │                                   │
                    │  NEXT.JS SERVER / API ROUTES      │
                    │                                   │
                    ├───────────────────────────────────┤
                    │                                   │
                    ├─ middleware.ts                    │
                    │  ├─ JWT verification             │
                    │  ├─ Auth check                    │
                    │  └─ Module access check           │
                    │                                   │
                    ├─ /api/auth/*                      │
                    │  ├─ login                        │
                    │  ├─ signup                       │
                    │  ├─ logout                       │
                    │  └─ verify                       │
                    │                                   │
                    ├─ /api/modules                     │
                    │  └─ Get user's assigned modules   │
                    │                                   │
                    ├─ /api/[module]/*                  │
                    │  ├─ CRM: /api/crm/leads           │
                    │  ├─ Invoicing: /api/invoicing/*   │
                    │  ├─ Accounting: /api/accounting/* │
                    │  └─ ... (other modules)           │
                    │                                   │
                    ├─ /api/admin/*                     │
                    │  ├─ /users                        │
                    │  ├─ /modules                      │
                    │  ├─ /field-config                 │
                    │  └─ /settings                     │
                    │                                   │
                    └───────────────────────────────────┘
                                      │
                    ┌─────────────────▼─────────────────┐
                    │                                   │
                    │   DATABASE (PostgreSQL)           │
                    │                                   │
                    ├───────────────────────────────────┤
                    │                                   │
                    ├─ Tables:                          │
                    │  ├─ User (with assignedModules)   │
                    │  ├─ Organization                  │
                    │  ├─ Module                        │
                    │  ├─ FieldConfiguration            │
                    │  ├─ Lead (CRM)                    │
                    │  ├─ Invoice (Invoicing)           │
                    │  ├─ [other module data]           │
                    │  ├─ AuditLog (all changes)        │
                    │  └─ RefreshToken                  │
                    │                                   │
                    └───────────────────────────────────┘


DATA FLOW EXAMPLE: User creates a lead
════════════════════════════════════════

1. User fills lead form in /app/crm/leads/create
   - Form shows only visible fields (from FieldConfiguration)
   - Red asterisks on required fields (from FieldConfiguration)

2. User clicks "Save"

3. Browser sends: POST /api/crm/leads
   - Body: { firstName, lastName, email, ... }
   - HTTP cookie: payaid_token=<JWT>

4. Next.js server:
   ├─ middleware.ts:
   │  ├─ Extract JWT from cookie
   │  ├─ Verify signature
   │  └─ Attach user to request
   │
   └─ /api/crm/leads route:
      ├─ Get user from request
      ├─ Check: 'crm' in user.assignedModules
      ├─ Query FieldConfiguration from DB
      ├─ Validate mandatory fields
      ├─ Insert Lead into DB
      ├─ Insert AuditLog entry
      └─ Return: { success: true, id: 123 }

5. Browser receives success response

6. Browser redirects to /app/crm/leads/[id]

7. Page loads lead detail view

8. User can now see the newly created lead
```

---

**These diagrams provide visual understanding of:**
- User journeys from signup to using modules
- Database relationships
- Authentication and authorization flows
- Module access control
- Admin field configuration
- Module switching with SSO
- Complete system architecture

Use these as reference during implementation and for explaining the system to stakeholders!
