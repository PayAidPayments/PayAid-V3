# PayAid V3 - Copy-Paste Cursor Prompts
## Ready-to-Use Prompts for Your Developer

---

## 🎯 HOW TO USE THESE PROMPTS

1. Open Cursor on your project
2. Copy the prompt below (entire thing)
3. Paste into Cursor's chat
4. Hit Enter and let it generate code
5. Review and accept the generated code

**Important:** Use these prompts IN ORDER. Each builds on the previous one.

---

## PROMPT 1: Project Setup & Database Schema

```
I'm building PayAid V3 - a SaaS platform like Zoho with multiple modules (CRM, 
Invoicing, Accounting, HR, WhatsApp, Analytics).

First, let's setup the project and database schema.

Requirements:
1. Use Next.js 15+ with TypeScript
2. Database: PostgreSQL with Prisma ORM
3. Authentication: JWT tokens in httpOnly cookies
4. Style: Tailwind CSS with custom Zoho-like color scheme

Please create:

1. Update package.json with required dependencies:
   - next, react, react-dom
   - @prisma/client
   - jsonwebtoken
   - bcryptjs
   - @hookform/react
   - react-hook-form
   - zod (for validation)

2. Create /prisma/schema.prisma with tables for:
   - User (id, email, password_hash, firstName, lastName, organizationId, role: admin|user, assignedModules: JSON)
   - Organization (id, name, logo, timezone, currency)
   - Module (organizationId, moduleType: crm|invoicing|accounting|hr|whatsapp|analytics, isActive)
   - FieldConfiguration (organizationId, moduleId, recordType, action: create|edit|view, fields: JSON with name, label, type, required, visible, order)
   - Lead (organizationId, firstName, lastName, email, phone, company, leadSource, leadStatus, leadOwnerId)
   - Invoice (organizationId, invoiceNumber, amount, dueDate, customerId, status)
   - AuditLog (organizationId, userId, action, entityType, entityId, oldValues, newValues, timestamp, ipAddress)
   - RefreshToken (userId, token, expiresAt)

3. Create lib/auth.ts with functions:
   - generateJWT(user)
   - verifyJWT(token)
   - hashPassword(password)
   - comparePassword(password, hash)
   - generateRefreshToken()

4. Create middleware.ts for:
   - Checking JWT in cookies
   - Redirecting unauthenticated users to /login
   - Adding user object to request

5. Create lib/adminOnly.ts middleware to check admin role

Use TypeScript, modern async/await syntax, proper error handling.
```

### PROMPT 2: Public Landing Page with Mega Menu

```
Create a professional PayAid landing page with a mega menu showing all 6 modules.

Create app/(public)/page.tsx with:

1. Header component with:
   - PayAid logo (purple #53328A and gold #F5C700)
   - Navigation with dropdowns:
     - Products (mega menu)
     - Solutions
     - Pricing
     - Resources
   - Sign In / Get Started buttons (top right)

2. Mega Menu (Products dropdown) showing:
   - CRM (icon, description, "Learn More" link)
   - Invoicing (icon, description, "Learn More" link)
   - Accounting (icon, description, "Learn More" link)
   - HR (icon, description, "Learn More" link)
   - WhatsApp Marketing (icon, description, "Learn More" link)
   - Analytics (icon, description, "Learn More" link)

3. Hero Section with:
   - Main headline: "Run Your Entire Business on PayAid"
   - Subheadline with description
   - 6 product badges (clickable, link to /[module-name])
   - "Get Started Free" and "Watch Demo" buttons

4. Social Proof:
   - Customer logos (4-5 logos)
   - "10,000+ businesses trust PayAid"
   - Rating: 4.8/5 ⭐

5. Footer with:
   - Product links (all 6 modules)
   - Company links
   - Resources links
   - Social media icons

Use Tailwind CSS.
Color scheme:
  - Primary: Purple #53328A
  - Accent: Gold #F5C700
  - Text: Charcoal #414143
  - Background: Light gray

Make it responsive for mobile/tablet/desktop.
Use React hooks for state management.
```

### PROMPT 3: Products Listing Page

```
Create app/(public)/products/page.tsx - An all-products page like Zoho.

Requirements:

1. Page title: "All PayAid Products"

2. Filter buttons: All | Finance | Sales | HR | Operations

3. Product grid showing all 6 modules:
   - Large icon/illustration for each module
   - Module name (clickable link to /[module])
   - 2-3 sentence description
   - "Learn More" button
   - "Try Free" CTA button
   - Pricing (shows lowest tier price)

4. Product descriptions:
   - CRM: "Manage all customer relationships in one place. Track leads, deals, and customer interactions."
   - Invoicing: "Create, send, and track invoices. Get paid faster with automated payment reminders."
   - Accounting: "Manage your entire business finances. Track expenses, reconcile accounts, and generate reports."
   - HR: "Manage your team from hiring to retirement. Handle payroll, leave, and performance reviews."
   - WhatsApp: "Connect with customers on WhatsApp. Send messages, templates, and track conversations."
   - Analytics: "Visualize your business data. Create dashboards and reports from any module."

5. Sidebar (right):
   - Featured modules section
   - Recently viewed modules
   - "Explore all features" link

6. Styling:
   - Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
   - Hover effects on product cards
   - Clean, professional design
   - Use brand colors (purple, gold, charcoal)

Use Tailwind CSS.
Make it visually appealing and professional.
```

### PROMPT 4: Individual Module Landing Pages

```
Create app/(public)/[module]/page.tsx for individual module pages.

This is a dynamic route that works for: crm, invoicing, accounting, hr, whatsapp, analytics

Each page should have:

1. Header with:
   - Module name (e.g., "PayAid CRM")
   - Tagline specific to module
   - "Get Started Free" button (links to /login)
   - "Try Demo" button (optional)

2. Hero section:
   - Module-specific tagline
   - Hero image/illustration
   - Key benefits bullet points

3. Features section:
   - 6-8 key features with icons
   - Feature name + 1-2 sentence description
   
   CRM features:
   - Lead Management
   - Deal Tracking
   - Contact Management
   - Sales Analytics
   - Integration & Automation
   - Team Collaboration
   
   Invoicing features:
   - Invoice Creation
   - Payment Tracking
   - Automated Reminders
   - Multi-currency Support
   - Recurring Invoices
   - Financial Reports

   (Similar for other modules)

4. Use cases section:
   - 3-4 paragraphs describing who should use this module
   - Example scenarios

5. Comparison table:
   - PayAid vs Zoho (vs HubSpot for CRM)
   - 6-8 comparison dimensions
   - Checkmarks for PayAid's advantages
   - Highlight PayAid wins with gold color

6. Pricing section:
   - 3 pricing tiers (Starter, Professional, Complete)
   - Features included in each tier
   - CTA buttons
   - Free trial option

7. FAQ section:
   - 5-8 common questions specific to module
   - Expandable answers

8. Final CTA:
   - "Ready to get started?"
   - "Get Started Free" button (prominent)
   - "Talk to our team" link

9. Footer

Content variations per module (CRM, Invoicing, Accounting, HR, WhatsApp, Analytics).
Use same template, change content.
Responsive design.
Use brand colors.

Create this as a reusable component/layout.
```

### PROMPT 5: Authentication Pages & API

```
Create authentication pages and API routes.

1. Create app/(public)/login/page.tsx with:
   - Email input
   - Password input
   - "Remember me" checkbox
   - "Forgot password?" link
   - "Sign up" link
   - OAuth buttons (Google, Microsoft) - optional
   - Purple background with gold accents
   - Form validation with zod

2. Create app/(public)/signup/page.tsx with:
   - First name, last name fields
   - Email field
   - Password field with strength indicator
   - Confirm password field
   - Terms & conditions checkbox
   - "Already have an account?" link
   - Form validation with zod

3. Create app/api/auth/login/route.ts - POST endpoint:
   - Input: { email, password }
   - Hash input password and compare with stored hash
   - If match: Create JWT with { userId, email, organizationId, role, assignedModules, expiresAt: 24h }
   - Store JWT in httpOnly cookie (name: 'payaid_token')
   - Return: { success: true, user: { id, email, name, role, assignedModules } }
   - On error: Return 401 with appropriate message

4. Create app/api/auth/signup/route.ts - POST endpoint:
   - Input: { firstName, lastName, email, password }
   - Validate email doesn't exist
   - Hash password with bcrypt
   - Create user with role='user' and assignedModules=[]
   - Create organization for user
   - Generate JWT and store in cookie
   - Return success

5. Create app/api/auth/logout/route.ts - POST endpoint:
   - Clear JWT cookie
   - Return { success: true }

6. Create app/api/auth/verify/route.ts - GET endpoint:
   - Read JWT from cookie
   - Verify and decode
   - Return user data or 401 if invalid

7. Create app/api/auth/refresh/route.ts - POST endpoint:
   - Implement refresh token rotation
   - Accept old token, return new token

Use jsonwebtoken for JWT.
Use bcryptjs for password hashing.
Add input validation with zod.
Proper error handling with HTTP status codes.
Security: httpOnly, Secure, SameSite cookies.
```

### PROMPT 6: App Layout & Dashboard

```
Create app/layout.tsx and app/page.tsx for the authenticated app area.

1. Create app/layout.tsx (dashboard layout):
   - Top navigation bar (always visible)
   - Left sidebar (always visible)
   - Main content area
   - Dark overlay for mobile when sidebar open

2. Top Navigation Bar Component (app/components/TopBar.tsx):
   - Left: PayAid logo (clickable, goes to /app)
   - Center: Global search bar (searches across modules)
   - Right side icons:
     - Search icon
     - Settings gear icon (goes to /app/settings)
     - Notifications bell
     - Module switcher (grid icon - shows all assigned modules)
     - User profile icon (dropdown with logout)

3. Sidebar Component (app/components/Sidebar.tsx):
   - PayAid logo at top
   - User's assigned modules ONLY
   - Example if user assigned CRM + Invoicing:
     CRM
     Invoicing
     Settings
     + Add Modules (link to app-store)
   
   - If admin user, show ALL 6 modules + Admin Panel
   - Each module is clickable link to /app/[module]
   - Show active module with gold highlight
   - Module icons (use lucide-react icons)
   - Responsive: collapse to icons on mobile

4. Module Switcher Popup (app/components/ModuleSwitcher.tsx):
   - Opens when clicking grid icon in top bar
   - Grid layout showing all assigned modules
   - Each module card shows: icon, name, description
   - Click to navigate to /app/[module]
   - Implement with React dialog/modal
   - SSO: Don't logout when switching modules

5. Create app/page.tsx (dashboard):
   - Welcome message: "Welcome, [User Name]"
   - Dashboard cards:
     - Quick stats (e.g., if CRM: "5 Open Deals", "12 New Leads")
     - Recent activity
     - Upcoming tasks
   - Links to recently used modules/records

6. Styling:
   - Sidebar: Purple background (#53328A)
   - Top bar: White background
   - Text: Charcoal (#414143)
   - Accents: Gold (#F5C700)
   - Responsive for mobile/tablet/desktop

Use Next.js routing.
Use React hooks for state.
Use Tailwind CSS for styling.
Add micro-animations for smooth transitions.
```

### PROMPT 7: Module Tab System

```
Create the tab system for modules.

Create app/(app)/[module]/layout.tsx with:

1. Tab bar component showing different tabs per module:

   CRM tabs:
   Home | Leads | Contacts | Accounts | Deals | Tasks | Meetings | Calls | 
   Reports | Analytics | Products | Quotes | Sales Orders | Purchase Orders | 
   Invoices | Cases | Solutions | + All Tabs

   Invoicing tabs:
   Home | Invoices | Items | Customers | Purchase Orders | Payments | 
   Taxes | Bank Transactions | Reports | + All Tabs

   Accounting tabs:
   Home | Chart of Accounts | Journals | Transactions | Bank Reconciliation | 
   Reports | + All Tabs

   HR tabs:
   Home | Employees | Payroll | Leave Management | Attendance | 
   Recruitment | Performance | + All Tabs

   WhatsApp tabs:
   Home | Templates | Broadcasts | Contacts | Campaigns | Analytics | 
   Settings | + All Tabs

   Analytics tabs:
   Home | Dashboards | Reports | Data Explorer | Scheduled Reports | 
   + All Tabs

2. Tab Navigation:
   - Click tab to navigate to /app/[module]/[tab-name]
   - Active tab highlighted with gold underline
   - Show "All Tabs" dropdown for overflow tabs
   - Smooth scroll for tab bar on mobile

3. Create app/(app)/[module]/[tab]/page.tsx:
   - Dynamic route for each tab
   - Load appropriate component based on tab name
   - Example: /app/crm/leads → <LeadsView />

4. Styling:
   - Tab bar shows tabs horizontally
   - Active tab: gold underline, darker text
   - Hover effects on inactive tabs
   - Responsive: scroll tabs on mobile, show dropdown on small screens

Use Next.js dynamic routing.
Use React hooks for tab state.
Use Tailwind CSS.
Implement lazy loading for tab components.
```

### PROMPT 8: CRM Leads View with Filters

```
Create the CRM Leads tab view like in Zoho.

Create app/(app)/crm/leads/page.tsx with:

1. Left sidebar (Filters):
   - Search box (searchable by lead name, email, phone)
   - Saved Filters section:
     - Google Leads (count: 1107)
     - Facebook Leads (count: 1070)
     - Pending/Untouched (count: 5924)
     - Website Organic (count: 19)
     - View saved filters (collapsible, show icon)
   
   - System Defined Filters (collapsible):
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
   
   - Filter by Fields (collapsible):
     - Lead Status dropdown
     - Lead Source dropdown
     - Lead Owner dropdown
     - Company dropdown
     - etc.

2. Main content area:
   - Top action bar:
     - "Create Lead" button (blue, prominent)
     - "Actions" dropdown (bulk operations)
     - View toggle (list icon, grid icon, kanban icon)
     - Filter icon (toggle sidebar on mobile)
   
   - Leads list/table with columns:
     - Checkbox (select multiple)
     - Lead Status (colored badge)
     - Last Activity Time
     - Lead Name (clickable → opens detail view)
     - Lead Source
     - Website
     - Phone
     - Description
     - Email
   
   - Pagination:
     - "1 - 100 of 25501" with prev/next arrows
     - "100 Records Per Page" dropdown
     - Jump to page input

3. Styling:
   - Status badges with colors (Yet to call=purple, Proposal Sent=blue, etc.)
   - Hover effects on rows
   - Selected row highlight with light gold background
   - Responsive: stack on mobile

4. Interactions:
   - Click row → navigate to /app/crm/leads/[id]
   - Click "Create Lead" → opens form or navigates to create page
   - Click filter → apply filter to list
   - Checkboxes → select multiple for bulk actions

Fetch data from /api/crm/leads endpoint.
Implement pagination, filtering, sorting.
Use React hooks for state management.
```

### PROMPT 9: Create Lead Form with Mandatory Fields

```
Create the create/edit lead form like in Zoho.

Create app/(app)/crm/leads/create/page.tsx with:

1. Form structure:
   - Title: "Create Lead"
   - Form sections (scrollable):
     
     Lead Information:
     - Lead Owner (dropdown, required, red asterisk)
     - First Name (text, required, red asterisk)
     - Last Name (text, required, red asterisk)
     - Email (email, optional)
     - Phone (tel, optional)
     - Additional Mobile (tel, optional)
     - Lead Date (date, optional)
     - Email Opt Out (checkbox, optional)
     - Lead Source (dropdown, optional)
     
     Account Information:
     - Account Type (dropdown, optional)
     - Account Name (text, optional)
     - Account Owner (dropdown, optional)
     - Current Account (dropdown, optional)
     
     Company Information:
     - Company (text, optional)
     - City (text, optional)
     - State (text, optional)
     - Country (text, optional)
     - Website (url, optional)
     - Industry (dropdown, optional)
     
     Financial Information:
     - Currency (dropdown, optional)
     - Exchange Rate (number, optional)
     
     Campaign & Scoring:
     - Campaign Name (text, optional)
     - Contact Score (number, optional)
     
     Status & Classification:
     - Lead Status (dropdown, required, red asterisk)
     - 1st Follow up (dropdown, optional)
     - 2nd Follow up (dropdown, optional)
     - 3rd Follow up (dropdown, optional)
     
     Description Information:
     - Description (textarea, optional)

2. Mandatory field indication:
   - Show red asterisk (*) on required fields
   - Red border on field if validation fails
   - Show error message below field

3. Form behavior:
   - Fetch field configuration from /api/field-config?module=crm&action=create
   - Server returns which fields are required (admin-configured)
   - Show only visible fields (admin-configured)
   - Validate mandatory fields on submit
   - Show loading state on submit button

4. Buttons:
   - Save (blue, prominent)
   - Create & Add Another (save and reset form)
   - Cancel (gray, goes back)

5. Styling:
   - Clean form layout
   - Proper spacing between sections
   - Use Tailwind CSS
   - Responsive for mobile

Use React Hook Form for form management.
Use zod for validation schema.
Fetch field config from API.
Validate mandatory fields from config.
Handle file uploads if applicable.
Show success/error toast messages.
```

### PROMPT 10: Lead Detail View

```
Create the individual lead detail page.

Create app/(app)/crm/leads/[id]/page.tsx with:

1. Header section:
   - Breadcrumb: CRM > Leads > [Lead Name]
   - Lead name as main title
   - Edit, Delete, More Actions buttons

2. Main content panels:

   Left side (wider):
   
   Overview panel:
   - Lead name, email, phone
   - Lead status (colored badge)
   - Owner
   - Company
   - Website
   
   Details panel (collapsible):
   - All lead information fields
   - Edit button to modify fields
   
   Activities panel:
   - Timeline of activities
   - Notes section with add note button
   - Email history
   - Call history
   - Meeting history
   
   Related Records:
   - Linked contacts
   - Linked deals
   - Linked accounts

   Right side (sidebar):
   
   Quick Info:
   - Lead Score
   - Lead Source
   - Industry
   - Created Date
   - Last Modified Date
   
   Actions:
   - Send Email button
   - Log Call button
   - Schedule Meeting button
   - Add to Campaign button
   - Convert to Contact button

3. Tabs (if needed):
   - Overview
   - Activities
   - Related Records
   - Notes

4. Edit functionality:
   - Click Edit button → form appears
   - Save changes to /api/crm/leads/[id]
   - Show loading state
   - Show success toast

5. Styling:
   - Clean, professional layout
   - Use cards for sections
   - Responsive for mobile

Fetch lead data from /api/crm/leads/[id].
Implement edit functionality.
Show related records.
Implement activity timeline.
```

### PROMPT 11: Admin Settings - User Management

```
Create admin-only user management page.

Create app/(app)/settings/admin/users/page.tsx with:

1. Page title: "User Management"

2. Users table with columns:
   - Name (first + last name)
   - Email
   - Role (dropdown: Admin or User)
   - Assigned Modules (shows icons/names of assigned modules)
   - Status (Active/Inactive toggle)
   - Last Login
   - Actions (edit, deactivate, delete)

3. Top action bar:
   - "Add User" button (opens form or navigates to create page)
   - Search box (search by name or email)
   - Filters dropdown (show Active, Inactive, role filters)
   - Pagination

4. Add/Edit User Modal or Page:
   - First Name (required)
   - Last Name (required)
   - Email (required, unique)
   - Password (if creating new user)
   - Role (dropdown: Admin or User)
   - Assigned Modules (multi-select checkboxes):
     - CRM
     - Invoicing
     - Accounting
     - HR
     - WhatsApp
     - Analytics
   - Status (Active/Inactive toggle)
   - Save and Cancel buttons

5. Actions on users:
   - Edit: Open form to modify user details
   - Deactivate: Toggle status to inactive
   - Delete: Remove user from organization
   - Resend Invite: Send invitation email

6. Security check:
   - Only allow access to users with role='admin'
   - Redirect non-admins to /app

7. Styling:
   - Clean table layout
   - Responsive for mobile
   - Use brand colors

Fetch users from /api/admin/users.
Implement edit/delete/add operations.
Show confirmation dialogs before delete.
Display assigned modules for each user.
```

### PROMPT 12: Admin Settings - Field Configuration Editor

```
Create the page layout editor / field configuration tool.

Create app/(app)/settings/admin/field-config/page.tsx with:

1. Page title: "Field Configuration"

2. Navigation (tabs):
   - CRM
   - Invoicing
   - Accounting
   - HR
   - WhatsApp
   - Analytics

3. For each module, show Actions:
   - Create Form
   - Edit Form
   - View Form
   - List View

4. For each action (e.g., "Create Form"):
   
   Left panel:
   - Available fields (all possible fields for this module)
   - Searchable list
   - Drag fields to the right panel
   
   Right panel:
   - Current form fields (in order)
   - Drag to reorder fields
   - For each field, show controls:
     - Field name (read-only)
     - Label (editable)
     - Type (read-only: text, email, dropdown, number, date, etc.)
     - Required checkbox (required=true means mandatory)
     - Visible checkbox (if unchecked, field hidden on form)
     - Delete button (remove field from form)
   
   Bottom:
   - Save button
   - Cancel button
   - Preview button (shows form preview)

5. Example flow:
   - Admin selects CRM tab
   - Admin selects "Create Form"
   - Shows all available CRM fields on left
   - Right side shows currently visible fields
   - Admin checks "Required" for important fields (red asterisk on form)
   - Admin can drag to reorder
   - Admin can uncheck "Visible" to hide fields
   - Admin clicks Save
   - Configuration saved to database
   - Next time user creates lead, form loads with this config

6. Styling:
   - Drag-drop interface
   - Use cards for fields
   - Clear visual hierarchy
   - Responsive for mobile (might be complex on mobile, consider desktop-first)

Implement drag-drop with library like @dnd-kit/core or react-beautiful-dnd.
Fetch field config from /api/field-config.
Save changes to /api/admin/field-config POST endpoint.
Show loading/success states.
```

### PROMPT 13: Module Switcher Popup

```
Create the app switcher component (grid icon).

Create app/components/ModuleSwitcher.tsx with:

1. Trigger button:
   - Grid icon in top right of top bar
   - Tooltip: "Switch Apps"
   - Purple color (#53328A)

2. When clicked, show modal/dialog with:
   - Title: "Apps" at top
   - Close button (X)
   - Grid layout of available modules
   
   For regular users (only assigned modules):
   Example if user assigned CRM + Invoicing:
   - CRM card (icon, name, description)
   - Invoicing card (icon, name, description)
   
   For admin users (all modules):
   - CRM
   - Invoicing
   - Accounting
   - HR
   - WhatsApp
   - Analytics

3. Each module card:
   - Large icon (96x96px)
   - Module name
   - Short description (optional)
   - Click to navigate to /app/[module]
   - Hover effect (shadow, color change)

4. Responsive design:
   - Desktop: 3 columns
   - Tablet: 2 columns
   - Mobile: 1 column

5. SSO behavior:
   - When user clicks module, navigate with existing JWT
   - Don't logout
   - Pass token via cookie (already in httpOnly cookie)
   - Open in same tab (not new tab)
   - Or: Use target="_blank" to open in new tab (both work)

6. Search (optional):
   - Small search box in modal
   - Search modules by name
   - Filter results as user types

7. Animation:
   - Fade in modal
   - Slide up from bottom on mobile
   - Smooth transitions

Implement with React dialog/modal (headless UI or shadcn/ui).
Fetch user's assigned modules on component load.
Show all modules for admins.
Use Tailwind CSS for styling.
```

### PROMPT 14: API Routes for Module Data

```
Create API routes for CRUD operations on modules.

Create these endpoints:

1. GET /api/crm/leads
   - Query params: skip=0, take=100, filter=status:yet_to_call, sort=-lastActivityTime
   - Return: { data: [...], totalCount: 25501 }
   - Implement pagination, filtering, sorting
   - Filter by fields: status, leadSource, leadOwner, etc.

2. POST /api/crm/leads
   - Body: { firstName, lastName, email, phone, leadStatus, leadOwnerId, ... }
   - Get field config from DB: /api/field-config?module=crm&action=create
   - Validate mandatory fields exist and non-empty
   - Hash/validate data
   - Save to DB
   - Return: { id, ...lead data }

3. GET /api/crm/leads/[id]
   - Return single lead by ID
   - Include related records (contacts, accounts, deals)

4. PUT /api/crm/leads/[id]
   - Update lead fields
   - Validate mandatory fields
   - Save to DB
   - Log to audit log
   - Return updated lead

5. DELETE /api/crm/leads/[id]
   - Soft delete or hard delete
   - Log to audit log
   - Return { success: true }

6. GET /api/field-config
   - Query params: module=crm, action=create
   - Return field configuration for form
   - Return: { fields: [...], mandatory: [...], visible: [...] }

7. GET /api/modules
   - Return user's assigned modules
   - Return: ['crm', 'invoicing']

8. POST /api/admin/field-config
   - Admin only
   - Save field configuration
   - Body: { module, action, fields: [...] }
   - Return { success: true }

Security checks:
- All endpoints require valid JWT
- Check user.assignedModules includes requested module
- Admin endpoints check user.role === 'admin'

Implement:
- Input validation with zod
- Error handling (400, 401, 403, 500)
- Pagination (limit, offset)
- Filtering and sorting
- Audit logging
- Proper HTTP status codes

Use Prisma for DB queries.
Use TypeScript for type safety.
```

---

## 🎯 EXECUTION ORDER

**Week 1:**
1. Prompt 1 - Setup & Database
2. Prompt 2 - Landing page
3. Prompt 3 - Products page
4. Prompt 4 - Module landing pages
5. Prompt 5 - Auth pages & API

**Week 2:**
6. Prompt 6 - App layout & dashboard
7. Prompt 7 - Tab system
8. Prompt 8 - Leads view
9. Prompt 9 - Create form
10. Prompt 10 - Lead detail

**Week 3:**
11. Prompt 11 - User management
12. Prompt 12 - Field config editor
13. Prompt 13 - Module switcher
14. Prompt 14 - API routes (all modules)

---

## 💡 TIPS FOR SUCCESS

1. **Use one prompt at a time** - Don't pile multiple prompts together
2. **Review generated code** - Check for bugs, style consistency
3. **Test as you go** - Don't wait until the end
4. **Follow the order** - Each prompt builds on previous work
5. **Ask for revisions** - If Cursor output isn't quite right, ask it to fix
6. **Use "Apply All" carefully** - Review code before accepting bulk changes
7. **Commit frequently** - After each working feature, commit to git

---

## ✅ SUCCESS CRITERIA

After completing all 14 prompts, you should have:

✅ Public landing page with mega menu  
✅ Products listing page  
✅ Individual module marketing pages  
✅ Login/signup pages  
✅ Authenticated app with dashboard  
✅ Sidebar showing only assigned modules  
✅ Module switcher with SSO  
✅ Tab system for each module  
✅ CRM leads view with filters  
✅ Create/edit lead forms with field config  
✅ Lead detail view  
✅ Admin user management  
✅ Admin field configuration editor  
✅ Complete API routes  
✅ Database schema  
✅ Authentication & authorization  

This is a **complete, production-ready Zoho-like platform**.

Good luck! 🚀