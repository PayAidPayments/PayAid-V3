# PayAid V3 - Complete Zoho-Like Architecture
## Comprehensive Cursor AI Implementation Guide

---

## 🎯 EXECUTIVE SUMMARY

You want PayAid to be built **EXACTLY like Zoho** with:

1. **Public Landing Page** - Shows all products as clickable badges/mega menu
2. **Public Products Page** - Lists all 6 modules with descriptions
3. **Module Landing Pages** - Each module (CRM, Invoicing, etc.) has its own marketing page
4. **Admin-Only Admin Panel** - Only admins can configure settings, users, fields
5. **Zoho-Like Dashboard** - When logged in, users see only their assigned modules
6. **Module Tabs** - Each module has multiple tabs (Home, Leads, Contacts, etc.)
7. **App Switcher** - Purple icon (top right) shows all modules for quick access with SSO
8. **Admin Controls** - Admins can define mandatory fields via page layout editor

---

## 📱 ARCHITECTURE OVERVIEW

```
PUBLIC SITE (No login required)
├─ Landing page (payaid.io)
│  ├─ Hero with product badges/mega menu
│  └─ Links to each product landing page
├─ All Products page (/products)
│  └─ Grid of all 6 modules
├─ Individual Module Pages (/crm, /invoicing, /accounting, /hr, /whatsapp, /analytics)
│  ├─ Marketing content
│  ├─ Features list
│  ├─ Pricing
│  ├─ "Get Started" button
│  └─ Login link
└─ Login page (/login)

PRIVATE APP (Requires login)
├─ Dashboard (first page after login)
│  ├─ Sidebar: Only shows assigned modules
│  ├─ Top bar: Search + Settings + Module Switcher
│  └─ Content area: Module-specific dashboard
├─ Module Pages (/app/crm, /app/invoicing, etc.)
│  ├─ Tab bar: Home, Tab1, Tab2, Tab3, ... (different per module)
│  ├─ Left panel: Filters, views, saved filters
│  ├─ Main area: List view, form view, etc.
│  └─ Top right: Module switcher, settings, profile
└─ Module-Specific Features
   ├─ CRM: Leads, Contacts, Accounts, Deals, Tasks, Meetings, Calls, etc.
   ├─ Invoicing: Invoices, Items, Customers, etc.
   ├─ Accounting: Chart of Accounts, Journals, Reports, etc.
   ├─ HR: Employees, Payroll, Leave, etc.
   ├─ WhatsApp: Templates, Broadcasts, Reports, etc.
   └─ Analytics: Dashboards, Reports, Charts, etc.

ADMIN AREA (Only for admins)
├─ Settings (gear icon)
├─ User Management
├─ Module Settings
├─ Field Configuration (Page Layout Editor)
├─ Organization Settings
└─ Audit Logs
```

---

## 🗂 FILE STRUCTURE

```
payaid-v3/
├─ app/
│  ├─ (public)/
│  │  ├─ page.tsx                    # Landing page with mega menu
│  │  ├─ products/
│  │  │  └─ page.tsx                 # All products listing page
│  │  ├─ crm/
│  │  │  └─ page.tsx                 # CRM marketing page
│  │  ├─ invoicing/
│  │  │  └─ page.tsx                 # Invoicing marketing page
│  │  ├─ [module]/
│  │  │  └─ page.tsx                 # Individual module pages (accounting, hr, whatsapp, analytics)
│  │  └─ layout.tsx                  # Public layout (header with login link)
│  │
│  ├─ auth/
│  │  ├─ login/
│  │  │  └─ page.tsx                 # Login page
│  │  ├─ signup/
│  │  │  └─ page.tsx                 # Signup page
│  │  ├─ logout/
│  │  │  └─ route.ts                 # Logout API
│  │  └─ verify/
│  │     └─ route.ts                 # Verification API
│  │
│  ├─ app/
│  │  ├─ page.tsx                    # Dashboard (first page after login)
│  │  ├─ layout.tsx                  # App layout (sidebar + top bar)
│  │  ├─ [module]/
│  │  │  └─ page.tsx                 # Module main page
│  │  ├─ settings/
│  │  │  ├─ page.tsx                 # Settings page
│  │  │  ├─ admin/
│  │  │  │  ├─ users/
│  │  │  │  │  └─ page.tsx           # User management (admin only)
│  │  │  │  ├─ modules/
│  │  │  │  │  └─ page.tsx           # Module settings (admin only)
│  │  │  │  └─ field-config/
│  │  │  │     └─ page.tsx           # Page layout editor (admin only)
│  │  │  └─ profile/
│  │  │     └─ page.tsx              # User profile settings
│  │  └─ [module]/
│  │     ├─ page.tsx                 # Module home/dashboard
│  │     ├─ [tab]/
│  │     │  └─ page.tsx              # Module tabs (leads, contacts, etc.)
│  │     └─ [tab]/[id]/
│  │        └─ page.tsx              # Record detail page
│  │
│  ├─ api/
│  │  ├─ auth/
│  │  │  ├─ login/route.ts           # Login API
│  │  │  ├─ logout/route.ts          # Logout API
│  │  │  └─ verify/route.ts          # Token verify API
│  │  ├─ modules/
│  │  │  ├─ route.ts                 # Get assigned modules for user
│  │  │  └─ [moduleId]/
│  │  │     └─ route.ts              # Module-specific data
│  │  ├─ [module]/
│  │  │  ├─ route.ts                 # CUD operations
│  │  │  └─ [id]/route.ts            # Detail/update operations
│  │  ├─ admin/
│  │  │  ├─ users/route.ts           # User management API
│  │  │  ├─ modules/route.ts         # Module assignment API
│  │  │  ├─ field-config/route.ts    # Field configuration API
│  │  │  └─ settings/route.ts        # Organization settings API
│  │  └─ health/route.ts             # Health check endpoint
│  │
│  └─ middleware.ts                  # Auth middleware
│
├─ components/
│  ├─ public/
│  │  ├─ Header.tsx                  # Public header (logo + login)
│  │  ├─ Footer.tsx                  # Footer
│  │  ├─ MegaMenu.tsx                # Product mega menu
│  │  └─ HeroSection.tsx             # Landing page hero
│  │
│  ├─ app/
│  │  ├─ Sidebar.tsx                 # Sidebar with assigned modules
│  │  ├─ TopBar.tsx                  # Top navigation bar
│  │  ├─ ModuleSwitcher.tsx          # App switcher (grid icon)
│  │  ├─ Breadcrumb.tsx              # Breadcrumb navigation
│  │  ├─ SearchBar.tsx               # Global search
│  │  ├─ ProfileMenu.tsx             # User profile dropdown
│  │  └─ NotificationCenter.tsx      # Notifications
│  │
│  ├─ modules/
│  │  ├─ CRM/
│  │  │  ├─ LeadsTab.tsx             # Leads view with filters
│  │  │  ├─ ContactsTab.tsx          # Contacts view
│  │  │  ├─ CreateLeadForm.tsx       # Create lead form (with mandatory fields)
│  │  │  ├─ LeadDetailView.tsx       # Single lead detail page
│  │  │  └─ LeadFilters.tsx          # Saved filters panel
│  │  ├─ Invoicing/
│  │  │  ├─ InvoicesTab.tsx
│  │  │  ├─ CreateInvoiceForm.tsx
│  │  │  └─ InvoiceDetailView.tsx
│  │  └─ [other modules...]
│  │
│  └─ admin/
│     ├─ UserManagement.tsx          # User management table
│     ├─ ModuleAssignment.tsx        # Assign modules to users
│     ├─ FieldConfigEditor.tsx       # Page layout / field config editor
│     └─ SettingsPanel.tsx           # Organization settings
│
├─ hooks/
│  ├─ useAuth.ts                     # Auth context hook
│  ├─ useAssignedModules.ts          # Get user's assigned modules
│  ├─ useModuleData.ts               # Fetch module data
│  ├─ usePageLayout.ts               # Get mandatory/hidden fields
│  └─ useModuleSwitcher.ts           # Handle SSO between modules
│
├─ lib/
│  ├─ auth.ts                        # Auth utilities
│  ├─ db.ts                          # Database client
│  ├─ jwt.ts                         # JWT handling
│  ├─ moduleConfig.ts                # Module definitions
│  ├─ adminOnly.ts                   # Admin role check middleware
│  └─ sso.ts                         # SSO token handling
│
├─ types/
│  ├─ user.ts                        # User type definition
│  ├─ module.ts                      # Module type definition
│  ├─ lead.ts                        # Lead type (CRM)
│  ├─ invoice.ts                     # Invoice type (Invoicing)
│  └─ auth.ts                        # Auth types
│
├─ styles/
│  ├─ globals.css                    # Global styles
│  ├─ zoho-purple.css                # Zoho purple color scheme
│  └─ dashboard.module.css           # Dashboard-specific styles
│
├─ public/
│  ├─ logo.svg
│  ├─ crm-icon.svg
│  ├─ invoicing-icon.svg
│  └─ ...other icons
│
├─ prisma/
│  ├─ schema.prisma                  # Database schema
│  └─ migrations/
│
└─ package.json
```

---

## 🎬 DETAILED CURSOR PROMPTS

### PROMPT 1: Create Public Landing Page with Mega Menu

```
Create a professional SaaS landing page for PayAid with a mega menu 
showing all products like Zoho does.

Requirements:
1. Header with:
   - PayAid logo on the left (purple and gold)
   - Products dropdown (mega menu showing all 6 modules as cards)
   - Solutions dropdown
   - Pricing link
   - Resources dropdown
   - Sign In / Get Started buttons (right side)

2. Hero section with:
   - Main headline: "Run Your Entire Business on PayAid"
   - Subheadline explaining the unified platform
   - Product badges/icons for all 6 modules (CRM, Invoicing, Accounting, HR, WhatsApp, Analytics)
   - Each badge is clickable and links to /[module-name]
   - "Get Started" CTA button

3. Mega Menu Details:
   Display as grid showing:
   - CRM (with description, icon, "Learn More" link)
   - Invoicing (with description, icon, "Learn More" link)
   - Accounting (with description, icon, "Learn More" link)
   - HR (with description, icon, "Learn More" link)
   - WhatsApp Marketing (with description, icon, "Learn More" link)
   - Analytics (with description, icon, "Learn More" link)

4. Social proof section:
   - Customer logos
   - "10,000+ businesses trust PayAid"
   - Rating (4.8/5)

5. Footer with all links

Use Next.js, React, Tailwind CSS.
Brand colors: Gold (#F5C700), Purple (#53328A), Charcoal (#414143)
Reference: https://www.zoho.com/
```

### PROMPT 2: Create Public Products Page

```
Create a /products page listing all PayAid modules like Zoho's all-products page.

Requirements:
1. Page title: "All PayAid Products"
2. Filter/category buttons: All | Finance | Sales | HR | Operations
3. Product grid showing all 6 modules with:
   - Large icon/illustration
   - Product name (clickable link to /[module])
   - Description (2-3 sentences)
   - "Learn More" button
   - Pricing info
   - "Try Free" CTA button

4. Each product card should highlight:
   - CRM: "Manage customer relationships"
   - Invoicing: "Create and track invoices"
   - Accounting: "Manage business finances"
   - HR: "Manage employees and payroll"
   - WhatsApp: "Connect with customers on WhatsApp"
   - Analytics: "Visualize your business data"

5. Right sidebar with:
   - Still showing the mega menu for easy navigation
   - Featured modules
   - Recently viewed

Reference: https://www.zoho.com/all-products.html

Use Tailwind CSS, responsive design for mobile/tablet/desktop.
```

### PROMPT 3: Create Individual Module Landing Pages

```
Create individual landing pages for each module (/crm, /invoicing, etc.).

Each page should have:

1. Header with:
   - Module name (e.g., "PayAid CRM")
   - Tagline
   - "Get Started" and "Try for Free" buttons
   - Login link in top right

2. Hero section with:
   - Module illustration/image
   - Key benefits
   - Pricing information

3. Features section:
   - 5-8 key features with icons
   - Each feature has name + description

4. Use cases section:
   - 3-4 use cases specific to module
   - Who is it for

5. Comparison section (vs Zoho/competitors):
   - Feature comparison table
   - Highlight PayAid advantages

6. Pricing section:
   - 2-3 pricing tiers
   - Features per tier
   - Free trial offer

7. FAQ section:
   - 5-8 common questions

8. Final CTA section:
   - "Ready to get started?"
   - "Get Started Free" button
   - "Talk to us" link

9. Footer

Make each module page have unique content for:
- /crm
- /invoicing
- /accounting
- /hr
- /whatsapp
- /analytics

Use the same design template, just change the module-specific content.
Reference: https://www.zoho.com/en-in/crm/
```

### PROMPT 4: Create Login/Auth Pages

```
Create authentication pages: /login, /signup, and auth API endpoints.

1. Login Page (/login):
   - Email and password fields
   - "Remember me" checkbox
   - "Forgot password?" link
   - Sign up link
   - OAuth options (Google, Microsoft)
   - Brand colors: Purple background, gold accents

2. Signup Page (/signup):
   - First name, last name, email fields
   - Create password (with strength indicator)
   - Terms & conditions checkbox
   - Already have account? Link to login
   - Same brand styling

3. API Endpoints (/api/auth):
   - POST /api/auth/login
     Input: email, password
     Output: JWT token, user object, assigned modules
   
   - POST /api/auth/signup
     Input: firstName, lastName, email, password
     Output: JWT token, user object
   
   - POST /api/auth/logout
     Input: JWT token
     Output: success message
   
   - GET /api/auth/verify
     Input: JWT token (in header)
     Output: user object, assigned modules, role (admin or user)

4. JWT should include:
   - userId
   - email
   - role (admin or user)
   - assignedModules: ['crm', 'invoicing', ...]
   - expiresAt

5. Store JWT in httpOnly cookie for security
6. Implement refresh token rotation

Use bcrypt for password hashing.
Use jsonwebtoken for JWT.
Store in database using Prisma.
```

### PROMPT 5: Create App Dashboard & Layout

```
Create the main app layout after login (/app/page.tsx and app/layout.tsx).

This is what users see after logging in - like the first image (home/dashboard).

1. Top Navigation Bar (always visible):
   - PayAid logo/home link on left
   - Search bar in center (global search across all modules)
   - Settings icon (gear)
   - Notifications bell
   - Module Switcher (grid icon - opens all modules in popup)
   - User profile icon (dropdown with logout)

2. Left Sidebar (always visible):
   - PayAid logo at top
   - User's assigned modules ONLY (filtered from the 6 available)
   - Example: If user assigned CRM + Invoicing:
     ├─ 🎯 CRM
     ├─ 💰 Invoicing
     ├─ ⚙️ Settings
     └─ + Add Modules (link to app-store for upgrades)
   
   - If admin user, add:
     ├─ 🎯 CRM
     ├─ 💰 Invoicing
     ├─ 📊 Accounting
     ├─ 👥 HR
     ├─ 💬 WhatsApp
     ├─ 📈 Analytics
     ├─ ⚙️ Settings (special admin settings)
     └─ 👨‍💼 Admin Panel

3. Main Content Area:
   - Breadcrumb showing: Home > Current Module
   - Welcome message: "Welcome [User Name]"
   - Dashboard cards showing:
     - Quick stats (e.g., "5 Open Deals" for CRM)
     - Recent activity
     - Upcoming tasks/events
   - Links to recently accessed items

4. Module Switcher Popup (when clicking grid icon):
   - Show all available modules (only assigned ones for regular users, all for admins)
   - Large clickable icons for each module
   - Opens in new tab with SSO (no need to login again)
   - Shows: CRM, Invoicing, Accounting, HR, WhatsApp, Analytics
   - Each opens /app/[module-name]

5. Sidebar behavior:
   - Shows ONLY assigned modules for regular users
   - Shows ALL modules for admin users
   - Clean, not cluttered
   - Module icons are visible
   - Click module to navigate to /app/[module-name]

6. Color scheme:
   - Sidebar: Purple (#53328A)
   - Top bar: White/gray
   - Text: Charcoal (#414143)
   - Accents: Gold (#F5C700)

Reference the first image (Zoho CRM dashboard).
Use Next.js, React, Tailwind CSS.
Implement with TypeScript.
```

### PROMPT 6: Create Module Tabs Architecture

```
Create the tab system for each module, like CRM has:
Home, Leads, Contacts, Accounts, Deals, Tasks, Meetings, Calls, Reports, etc.

1. Tab Bar (below main header for each module):
   - Home (module dashboard)
   - Tab1 (e.g., Leads for CRM)
   - Tab2 (e.g., Contacts for CRM)
   - Tab3 (e.g., Accounts for CRM)
   - ... more tabs specific to module
   - All Tabs (dropdown showing all available tabs)

2. For CRM module, tabs should be:
   Home | Leads | Contacts | Accounts | Deals | Tasks | 
   Meetings | Calls | Reports | Analytics | Products | Quotes | 
   Sales Orders | Purchase Orders | Invoices | Cases | Solutions | 
   + More (shows: Documents, Forecasts, Visits, Social, Facebook Ads, 
          Facebook Accounts, Google Ads, Messages, My Jobs, Services)

3. For Invoicing module, tabs:
   Home | Invoices | Items | Customers | Purchase Orders | Payments | 
   Tax | Bank | + More

4. For Accounting module, tabs:
   Home | Chart of Accounts | Journals | Transactions | Reports | 
   Bank Reconciliation | + More

5. For HR module, tabs:
   Home | Employees | Payroll | Leave | Attendance | Recruitment | 
   Performance | + More

6. Tab Navigation:
   - Click tab to load that view
   - URL updates to /app/[module]/[tab-name]
   - Tab state persists in browser
   - Show active tab with gold/purple highlight

7. Each tab loads different component:
   - LeadsTab.tsx shows list of leads with filters
   - ContactsTab.tsx shows list of contacts
   - Etc.

8. List view for each tab should show:
   - Filterable/searchable list
   - Columns customizable
   - Sort options
   - View toggle (list, grid, kanban if applicable)
   - Create button for that record type

Create the tab bar component and wire up routing for 
/app/[module]/[tab] pages.

Reference: Second and third images showing Zoho's tab system.
```

### PROMPT 7: Create CRM Leads View with Filters

```
Create the CRM Leads tab view like in the second image.

1. Left Panel (Filters):
   - Search box
   - Saved Filters:
     - Google Leads (1107)
     - Facebook leads (1070)
     - Pending/Untouched (5924)
     - Website Organic (19)
   - System Defined Filters:
     - Touched Records
     - Untouched Records
     - Record Action
     - Related Records Action
     - Scoring Rules
     - Locked
     - Latest Email Status
     - Activities
     - Campaigns
     - Cadences
   - Filter by Fields section (expandable)

2. Main Content Area:
   - Filter bar showing currently applied filters
   - List view with columns:
     - Checkbox (select multiple)
     - Lead Status (with colored badge: "Yet to call", "Proposal Sent", etc.)
     - Last Activity Time
     - Lead Name
     - Lead Source
     - Website
     - Phone
     - Description
     - Email
   
   - Pagination: "1-100 of 25501" with prev/next buttons
   - "100 Records Per Page" dropdown
   - View toggle (list, grid, etc.)

3. Top Action Bar:
   - "Create Lead" button (blue, prominent)
   - "Actions" dropdown (bulk actions)
   - Filter button (show/hide left panel)

4. When clicking a row:
   - Open that lead's detail view (image 4)
   - Shows all lead information
   - Edit button, delete button
   - Related records section

5. Color scheme:
   - List styling similar to Zoho
   - Badges with colors (Yet to call = purple, Proposal Sent = blue, etc.)
   - Hover effects on rows
   - Selected row highlight

Reference: Second image showing Zoho Leads view.
Use Tailwind CSS, implement with React components.
Implement using /api endpoints to fetch lead data.
```

### PROMPT 8: Create Lead Creation Form with Mandatory Fields

```
Create the "Create Lead" form like in image 3.

CRITICAL: Admin can define which fields are mandatory.

1. Form should have:
   - Lead Owner (dropdown with assigned user)
   - First Name
   - Last Name
   - Email
   - Phone
   - Company
   - City, State, Website
   - Industry (dropdown)
   - Current Account (dropdown)
   - Currency
   - Exchange Rate
   - Lead Source (dropdown)
   - Campaign Name
   - Contact Score
   - Lead Status
   - + Many more fields (scroll to see all)

2. Mandatory Fields (Indicated with red asterisk *):
   - Admin can configure which fields are mandatory
   - Red border on mandatory field if empty on submit
   - Show error message if mandatory field empty

3. Field Sections:
   - Lead Information (top)
   - Additional fields (scrollable)
   - Description Information
   - (More sections as you scroll)

4. Buttons:
   - Save (blue, prominent)
   - Create & Link (if creating from related record)
   - Cancel

5. Field Configuration (Admin Only):
   - Admins can access Settings > Page Layout
   - Configure which fields show/hide
   - Configure which fields are mandatory
   - Drag to reorder fields
   - Save configuration

6. Database:
   - Store field configuration per organization/module
   - Get field config via API when loading form
   - Validate mandatory fields on submit

Reference: Image 3 showing the create lead form with red asterisks on mandatory fields.
Use React Hook Form for form handling.
Implement field validation.
```

### PROMPT 9: Create Module Switcher (App Grid Icon)

```
Create the app switcher that appears when clicking the grid icon 
(top right of the screen, as shown in image 5).

Requirements:

1. Grid Icon Button:
   - Located in top right corner of the top bar
   - Purple color (#53328A)
   - Grid/app switcher icon
   - Shows number of available apps (e.g., "6 Apps")

2. When clicked, shows a popup/modal with:
   - Title: "Apps"
   - Grid layout showing all modules the user has access to:
   
   For regular users (only assigned modules):
   ├─ CRM (if assigned)
   ├─ Invoicing (if assigned)
   ├─ Accounting (if assigned)
   ├─ HR (if assigned)
   ├─ WhatsApp (if assigned)
   └─ Analytics (if assigned)
   
   For admin users (all modules):
   ├─ CRM
   ├─ Invoicing
   ├─ Accounting
   ├─ HR
   ├─ WhatsApp
   └─ Analytics

3. Each module card in the grid should show:
   - Large icon
   - Module name
   - Short description (optional)
   - Click to navigate to /app/[module]

4. SSO Behavior:
   - When switching modules, don't logout
   - Pass JWT token via URL or cookie
   - User stays logged in across all modules
   - No password prompt needed

5. Search/Filter (optional):
   - Search box in the popup
   - Filter modules by name
   - Recently accessed modules at top

6. Styling:
   - Modal/popup centered on screen
   - Dark overlay background
   - Grid layout (2-3 columns on desktop, 1 on mobile)
   - Each card is clickable with hover effect
   - Close button (X) in top right

Reference: Image 5 showing the app grid.
This is like Zoho's app switcher.
Implement using React modal/dialog.
```

### PROMPT 10: Create Admin Settings Panel

```
Create the admin-only settings area for organization admins.

Location: /app/settings or /app/admin

Admin users ONLY can access this. Regular users see only user profile settings.

1. Admin Settings Menu (Left Sidebar):
   - Organization Settings
   - User Management
   - Module Configuration
   - Field Configuration (Page Layout Editor)
   - Audit Logs
   - API Settings

2. User Management (/app/settings/admin/users):
   - List all users in organization
   - Columns: Name, Email, Role (Admin/User), Assigned Modules, Status
   - Add User button (top right)
   - Edit user: Click to change role, assign modules, deactivate
   - Search/filter users

3. Module Configuration (/app/settings/admin/modules):
   - Show all available modules
   - Toggle to activate/deactivate for organization
   - Set default modules for new users
   - Show usage statistics per module

4. Field Configuration - Page Layout Editor (/app/settings/admin/field-config):
   - For each module (CRM, Invoicing, etc.)
   - For each action (Create, Edit, View)
   
   Show interface to:
   - See all available fields
   - Drag to reorder fields on form
   - Toggle "Required" checkbox (makes field mandatory)
   - Toggle "Visible" checkbox (hide/show field)
   - Set field type (text, dropdown, email, phone, etc.)
   - Save configuration
   
   When saved, all forms in that module use this configuration.

5. Organization Settings:
   - Company name, logo, timezone
   - Currency, language
   - Email settings
   - Storage settings

6. Audit Logs:
   - Show who did what and when
   - User created, user deleted, field config changed, etc.
   - Exportable CSV

7. API Settings:
   - API keys management
   - Webhooks
   - API documentation link

8. Security:
   - Only show this section if user.role === 'admin'
   - Log all admin actions
   - Require password confirmation for sensitive changes

Reference: This mimics Zoho's admin panel.
Build admin-only middleware to protect routes.
Implement checkAdminRole middleware on all admin routes.
```

### PROMPT 11: Database Schema with Prisma

```
Create the Prisma database schema for PayAid V3.

Tables needed:

1. User table:
   - id (UUID, primary key)
   - email (unique)
   - password (hashed)
   - firstName, lastName
   - organizationId (foreign key)
   - role (admin or user)
   - assignedModules (JSON array: ['crm', 'invoicing', ...])
   - createdAt, updatedAt
   - isActive (boolean)

2. Organization table:
   - id (UUID)
   - name
   - logo (URL)
   - timezone
   - currency
   - industry
   - createdAt, updatedAt

3. Module table:
   - id (UUID)
   - organizationId (foreign key)
   - moduleType (crm, invoicing, accounting, hr, whatsapp, analytics)
   - isActive (boolean)
   - settings (JSON)
   - createdAt, updatedAt

4. FieldConfiguration table:
   - id (UUID)
   - organizationId, moduleId (foreign keys)
   - recordType (lead, contact, account, deal, etc.)
   - action (create, edit, view, list)
   - fields (JSON array with):
     - fieldName
     - label
     - type (text, email, dropdown, etc.)
     - required (boolean)
     - visible (boolean)
     - order (integer for sorting)
   - createdAt, updatedAt

5. Lead table (CRM):
   - id (UUID)
   - organizationId (foreign key)
   - firstName, lastName, email, phone
   - company, website, city, state, country
   - leadSource, leadStatus, leadOwner
   - createdAt, updatedAt

6. Invoice table (Invoicing):
   - id (UUID)
   - organizationId (foreign key)
   - invoiceNumber, amount, dueDate
   - customerId, status
   - createdAt, updatedAt

7. AuditLog table:
   - id (UUID)
   - organizationId (foreign key)
   - userId (foreign key)
   - action (user_created, field_config_changed, etc.)
   - entityType (User, FieldConfig, etc.)
   - entityId
   - oldValues, newValues (JSON)
   - timestamp
   - ipAddress

8. RefreshToken table:
   - id (UUID)
   - userId (foreign key)
   - token (unique)
   - expiresAt
   - createdAt

Use PostgreSQL as database.
Setup Prisma ORM.
Create migrations.
```

### PROMPT 12: Authentication & Authorization Middleware

```
Create authentication and authorization middleware for PayAid V3.

Files to create:

1. lib/auth.ts:
   - generateJWT(user): Create JWT token with:
     - userId
     - email
     - organizationId
     - role
     - assignedModules
     - expiresAt: 24 hours
   
   - verifyJWT(token): Verify and decode token
   - hashPassword(password): Hash password with bcrypt
   - comparePassword(password, hash): Compare passwords
   - generateRefreshToken(): Create refresh token

2. middleware.ts (Next.js middleware):
   - Check for JWT in cookies
   - If accessing /app routes without JWT, redirect to /login
   - If accessing /login with valid JWT, redirect to /app
   - Add user object to request headers

3. lib/adminOnly.ts:
   - Middleware to check if user.role === 'admin'
   - Redirect non-admins to /app/dashboard
   - Used in /api/admin/* routes

4. lib/checkModuleAccess.ts:
   - Middleware to check if user has access to requested module
   - If user accessing /app/crm but CRM not in assignedModules:
     - Redirect to /app-store or show access denied

5. API endpoints protected:

   Public routes (no auth required):
   - GET /
   - GET /products
   - GET /[module] (e.g., /crm, /invoicing)
   - GET /login
   - GET /signup
   - POST /api/auth/login
   - POST /api/auth/signup
   - GET /api/health

   Protected routes (JWT required):
   - GET /app/* (all app routes)
   - GET /api/modules
   - GET /api/[module]/*

   Admin-only routes (admin role required):
   - GET /app/settings/admin/*
   - POST /api/admin/*
   - PUT /api/admin/*
   - DELETE /api/admin/*

6. Cookie security:
   - Store JWT in httpOnly, Secure, SameSite cookies
   - Never expose token to JavaScript
   - Implement CSRF protection

7. Token refresh:
   - Implement refresh token rotation
   - When JWT expires, use refresh token to get new JWT
   - Invalidate old refresh tokens

Use jsonwebtoken library.
Use bcryptjs for password hashing.
Implement with TypeScript.
```

### PROMPT 13: API Routes for Modules

```
Create API routes for each module to handle CRUD operations.

Structure:

/api/[module]/route.ts:
  GET /api/crm
    - Fetch all leads (with filters, pagination)
    - Query params: skip=0, take=100, filter=..., sort=...
    - Return: { data: [...], totalCount: 25501 }
  
  POST /api/crm
    - Create new lead
    - Body: { firstName, lastName, email, ... }
    - Validate mandatory fields from FieldConfiguration
    - Return: { id, ... }

/api/[module]/[id]/route.ts:
  GET /api/crm/[id]
    - Get single lead by ID
    - Return: { id, firstName, ... }
  
  PUT /api/crm/[id]
    - Update lead
    - Body: { field: value, ... }
    - Validate mandatory fields
    - Return: { success: true }
  
  DELETE /api/crm/[id]
    - Delete lead
    - Return: { success: true }

Special endpoints:

GET /api/modules
  - Get user's assigned modules
  - Return: ['crm', 'invoicing']

GET /api/field-config?module=crm&action=create
  - Get field configuration for form
  - Return: { fields: [...], mandatory: [...] }

POST /api/[module]/filter
  - Save/load saved filters
  - Used for "Google Leads", "Facebook Leads", etc.

GET /api/[module]/views
  - Get available views for module
  - Return list of saved views/filters

Implement:
- Input validation
- Error handling with proper HTTP status codes
- Pagination (limit, offset)
- Filtering and sorting
- Authorization checks (user has module access)
- Audit logging (log all changes)

Use Next.js API routes.
Return JSON responses.
```

---

## 🔑 KEY ARCHITECTURAL DECISIONS

### 1. Admin vs User Access

**Admins:**
- See ALL 6 modules in sidebar
- Can access /app/settings/admin/*
- Can change field configurations
- Can assign modules to users
- Can manage organization settings

**Regular Users:**
- See ONLY assigned modules in sidebar
- Cannot access admin settings
- Can only access assigned modules
- Form shows only visible fields (configured by admin)
- Mandatory fields enforced per admin configuration

### 2. Module Switching

- Click grid icon (top right) → see all assigned modules
- Click module → navigate to /app/[module]
- SSO: Don't logout, just switch
- Each module has its own URL namespace (/app/crm, /app/invoicing, etc.)

### 3. Tab System

- Each module has different tabs
- CRM: Home, Leads, Contacts, Accounts, Deals, Tasks, etc.
- Invoicing: Home, Invoices, Items, Customers, etc.
- Tabs are customizable per organization (advanced feature)
- Active tab persists in URL: /app/crm/leads

### 4. Field Configuration

- Admin defines which fields are mandatory
- Admin can hide/show fields on forms
- Admin can reorder fields
- Forms validate against this configuration
- Configuration stored in FieldConfiguration table

### 5. Authentication Flow

```
User visits payaid.io
  ↓
See landing page with mega menu
  ↓
Click on module (e.g., CRM)
  ↓
See /crm page (module landing page)
  ↓
Click "Get Started" or "Try Free"
  ↓
Redirect to /login
  ↓
Enter email + password
  ↓
JWT created with assignedModules
  ↓
Stored in httpOnly cookie
  ↓
Redirect to /app/page.tsx
  ↓
Sidebar shows assigned modules only
  ↓
Can click modules to navigate (SSO)
  ↓
Click module → /app/[module]/page.tsx
  ↓
See module dashboard with tabs
  ↓
Click tab → /app/[module]/[tab]/page.tsx
  ↓
See list view with filters
  ↓
Click to create or edit record
  ↓
Form loads with field configuration
  ↓
Validate mandatory fields
  ↓
Save to database
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 0: Setup (Week 0)
- [ ] Create Next.js project
- [ ] Setup Prisma + PostgreSQL
- [ ] Setup TypeScript
- [ ] Configure Tailwind CSS
- [ ] Create git repository

### Phase 1: Public Site (Week 1-2)
- [ ] Landing page with mega menu
- [ ] Products listing page
- [ ] Individual module landing pages
- [ ] Login/signup pages
- [ ] Auth API endpoints
- [ ] Database schema

### Phase 2: App Core (Week 3-4)
- [ ] App layout (sidebar + top bar)
- [ ] Dashboard page
- [ ] Module switcher
- [ ] Tab system
- [ ] Admin check middleware

### Phase 3: Module UIs (Week 5-6)
- [ ] CRM module (Leads, Contacts, Accounts, etc.)
- [ ] Invoicing module
- [ ] Accounting module
- [ ] HR module
- [ ] WhatsApp module
- [ ] Analytics module

### Phase 4: Admin Features (Week 7)
- [ ] User management
- [ ] Module assignment
- [ ] Field configuration editor
- [ ] Organization settings
- [ ] Audit logs

### Phase 5: Testing & Polish (Week 8)
- [ ] Testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Mobile responsiveness
- [ ] Launch!

---

## 🚀 FINAL NOTES

This architecture is designed to be:
- **Exactly like Zoho** in UX and structure
- **Admin-controlled** - Admins configure everything
- **User-friendly** - Users see only what they need
- **Scalable** - Easy to add new modules
- **Secure** - Proper auth, authorization, and audit logging
- **Professional** - Enterprise SaaS quality

Share these prompts with Cursor and it will build exactly what you've shown in the images.

Good luck! 🚀