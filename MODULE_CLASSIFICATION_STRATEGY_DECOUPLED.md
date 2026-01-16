# PayAid V3 - Module Classification & Navigation Strategy (Decoupled Architecture)

**Date:** January 2026  
**Status:** 📋 **ALIGNED WITH DECOUPLED ARCHITECTURE**  
**Version:** 2.0 - Decoupled Edition

---

## 🎯 Executive Summary

This document provides strategic recommendations **specifically aligned with PayAid V3's decoupled architecture** where:
- Each module = **Separate Next.js app**
- Each module = **Separate subdomain** (crm.payaid.in, finance.payaid.in)
- Each module = **Separate backend/database**
- **SSO** across modules (Supabase Auth)
- **API Gateway** for inter-module communication
- **Event-driven sync** (Redis)

---

## 1. 🏗️ Decoupled Architecture Implications

### Current Transformation Goal

**From:** Monolithic (all modules in one dashboard)  
**To:** Decoupled (each module is independent Next.js app)

**Architecture:**
```
┌─────────────────────────────────────────┐
│     Landing Page (app.payaid.in/home)   │
│     - Module discovery                  │
│     - SSO login                         │
└─────────────────────────────────────────┘
              │
              ├─── SSO ───┐
              │           │
              ▼           ▼
┌──────────────────┐  ┌──────────────────┐
│  CRM Module      │  │  Finance Module  │
│  crm.payaid.in   │  │  finance.payaid.in│
│  - Own Next.js   │  │  - Own Next.js   │
│  - Own Backend   │  │  - Own Backend   │
│  - Own Database  │  │  - Own Database  │
└──────────────────┘  └──────────────────┘
              │           │
              └───────────┘
                    │
                    ▼
            [API Gateway]
            [Event Bus (Redis)]
```

### Key Constraints

1. **No Shared Components** - Each module is a separate app
2. **Cross-Module Navigation** - Requires redirects to different subdomains
3. **SSO Required** - JWT tokens must work across subdomains
4. **API Gateway** - Modules communicate via API, not direct DB access
5. **Independent Deployment** - Each module can be deployed separately

---

## 2. 📊 Navigation Strategy for Decoupled Architecture

### ❌ Previous Recommendation (Monolithic)

**Previous Strategy:**
- Top Bar = Module-specific features
- Sidebar = Module switching + global features

**Problem:** This assumes shared components, which doesn't work in decoupled architecture!

### ✅ Revised Recommendation (Decoupled)

#### **Option A: Module-Specific Navigation Only** (Recommended)

**Each Module Has:**
- **Top Bar** = Module-specific features (horizontal tabs)
- **No Sidebar** = Or minimal sidebar with module switcher only

**CRM Module (crm.payaid.in):**
```
Top Bar:
[CRM Logo] [Home] [Leads] [Contacts] [Accounts] [Deals] [Tasks] [Reports] [⚙️]

No Sidebar (or minimal):
- [Switch Module] dropdown
  - → Finance (finance.payaid.in)
  - → Sales (sales.payaid.in)
  - → Back to Apps (app.payaid.in/home)
```

**Finance Module (finance.payaid.in):**
```
Top Bar:
[Finance Logo] [Home] [Invoices] [Accounting] [Purchase Orders] [GST] [Reports] [⚙️]

No Sidebar (or minimal):
- [Switch Module] dropdown
  - → CRM (crm.payaid.in)
  - → Sales (sales.payaid.in)
  - → Back to Apps (app.payaid.in/home)
```

**Benefits:**
- ✅ Each module is truly independent
- ✅ No shared components needed
- ✅ Simple navigation within module
- ✅ Module switching via dropdown/button

#### **Option B: Shared Navigation Service** (Alternative)

**Architecture:**
- Navigation data served by API Gateway
- Each module fetches navigation config
- Consistent UI but independent apps

**Implementation:**
```typescript
// Each module fetches navigation from API Gateway
const navigation = await fetch('https://api-gateway.payaid.in/navigation', {
  headers: { Authorization: `Bearer ${token}` }
})

// Returns:
{
  currentModule: 'crm',
  modules: [
    { id: 'crm', name: 'CRM', url: 'https://crm.payaid.in', active: true },
    { id: 'finance', name: 'Finance', url: 'https://finance.payaid.in', active: false },
    // ...
  ],
  features: [
    { name: 'Contacts', url: '/contacts', module: 'crm' },
    { name: 'Deals', url: '/deals', module: 'crm' },
    // ...
  ]
}
```

**Benefits:**
- ✅ Consistent navigation across modules
- ✅ Centralized configuration
- ✅ Easy to update navigation

**Drawbacks:**
- ❌ Requires API Gateway
- ❌ Adds dependency between modules

### ✅ Recommendation: **Option A - Module-Specific Navigation**

**Why:**
1. **True Independence** - Each module is self-contained
2. **No Dependencies** - Modules don't depend on shared services
3. **Simpler** - Easier to develop and deploy
4. **Scalable** - Each team works independently

---

## 3. 🏗️ Module Classification for Decoupled Architecture

### Critical: Module Boundaries Must Be Clear

In decoupled architecture, **module boundaries are physical, not logical**:
- Each module = Separate codebase
- Each module = Separate deployment
- Each module = Separate team

### ✅ Recommended Module Structure

#### **Core Modules (Independent Apps)**

| Module | Subdomain | Features | Database Schema |
|--------|-----------|----------|----------------|
| **CRM** | `crm.payaid.in` | Contacts, Accounts, Leads, Deals, Activities, Tasks | `crm_schema` |
| **Sales** | `sales.payaid.in` | Landing Pages, Checkout Pages, Orders, Quotes | `sales_schema` |
| **Finance** | `finance.payaid.in` | Invoices, Accounting, Purchase Orders, GST | `finance_schema` |
| **Marketing** | `marketing.payaid.in` | Campaigns, Email, Social Media, WhatsApp | `marketing_schema` |
| **HR** | `hr.payaid.in` | Employees, Payroll, Leave, Attendance | `hr_schema` |
| **Projects** | `projects.payaid.in` | Projects, Tasks, Time Tracking, Gantt | `projects_schema` |
| **Inventory** | `inventory.payaid.in` | Products, Stock, Warehouses | `inventory_schema` |

#### **Module Independence Rules**

1. **✅ Each Module Has:**
   - Own Next.js app
   - Own API routes (`/api/crm/*`, `/api/finance/*`)
   - Own database schema
   - Own navigation (top bar)
   - Own authentication (SSO via Supabase)

2. **❌ Modules Should NOT:**
   - Share components (use shared packages instead)
   - Access other modules' databases directly
   - Have hard dependencies on other modules

3. **✅ Inter-Module Communication:**
   - Via API Gateway
   - Via Event Bus (Redis)
   - Via SSO tokens

---

## 4. 🔄 What Belongs Where? (Decoupled Edition)

### CRM Module (`crm.payaid.in`)

**✅ Should Include:**
- **Contacts** - Customer/Lead management
- **Accounts** - Company/Organization management
- **Leads** - Lead capture and qualification
- **Deals/Opportunities** - Sales pipeline management
- **Activities** - Calls, emails, meetings, notes
- **Tasks** - Task management and reminders (CRM-specific)
- **Reports** - CRM-specific reports (pipeline, conversion, etc.)

**❌ Should NOT Include:**
- **Projects** - Belongs in Projects module (`projects.payaid.in`)
- **Orders** - Belongs in Sales module (`sales.payaid.in`)
- **Products** - Belongs in Inventory module (`inventory.payaid.in`)
- **Invoices** - Belongs in Finance module (`finance.payaid.in`)

**Why:** In decoupled architecture, moving features between modules requires:
- Creating new module app
- Migrating data
- Updating API Gateway routes
- Updating SSO redirects

**Better to get it right from the start!**

### Sales Module (`sales.payaid.in`)

**✅ Should Include:**
- **Landing Pages** - Lead generation pages
- **Checkout Pages** - Payment and order pages
- **Orders** - Order management and fulfillment
- **Quotes** - Sales quotes and proposals
- **Sales Analytics** - Sales performance metrics

**Shared with Inventory:**
- **Products** - Product catalog (via API Gateway)

### Finance Module (`finance.payaid.in`)

**✅ Should Include:**
- **Invoices** - Invoice creation and management
- **Accounting** - Expenses, P&L, Balance Sheet
- **Purchase Orders** - Vendor purchase management
- **GST Reports** - Tax compliance
- **Payments** - Payment tracking
- **Financial Reports** - Financial analytics

### Projects Module (`projects.payaid.in`) - NEW

**✅ Should Include:**
- **Projects** - Project creation and tracking
- **Tasks** - Project-specific tasks (different from CRM tasks)
- **Time Tracking** - Time logging
- **Resources** - Resource allocation
- **Gantt Charts** - Project timelines
- **Project Reports** - Project analytics

**Note:** This is a **separate Next.js app**, not part of CRM!

### Inventory Module (`inventory.payaid.in`)

**✅ Should Include:**
- **Products** - Product catalog
- **Stock Management** - Multi-location inventory
- **Warehouses** - Warehouse management
- **Stock Movements** - Stock transfers
- **Inventory Reports** - Stock analytics

**Shared with Sales:**
- Products accessible via API Gateway

---

## 5. 🏭 Industry Modules in Decoupled Architecture

### Challenge: Industry Modules as Add-ons

**Problem:** In decoupled architecture, industry modules can't just "extend" core modules. They need to be:
- Separate apps? (Too many apps)
- Part of core modules? (Defeats decoupling)
- Plugin system? (Complex)

### ✅ Recommended Approach: **Industry Modules as Feature Flags**

**Architecture:**
```
Core Module (crm.payaid.in)
├── Base Features (Contacts, Deals, etc.)
└── Industry Features (enabled via license)
    ├── Restaurant Features (if Restaurant module licensed)
    ├── Retail Features (if Retail module licensed)
    └── Manufacturing Features (if Manufacturing module licensed)
```

**Implementation:**
1. **Industry features** are code within core modules
2. **Enabled via license** check
3. **Separate database tables** per industry (e.g., `restaurant_menu`, `retail_pos`)
4. **API routes** scoped by industry (e.g., `/api/crm/restaurant/menu`)

**Benefits:**
- ✅ No need for separate apps per industry
- ✅ Industry features are part of core modules
- ✅ Easy to enable/disable via licensing
- ✅ Maintains decoupled architecture for core modules

**Example:**
```typescript
// CRM Module with Restaurant features
// app/api/crm/restaurant/menu/route.ts

export async function GET(request: NextRequest) {
  // Check if Restaurant module is licensed
  const { tenantId } = await requireModuleAccess(request, 'restaurant')
  
  // Return restaurant-specific data
  const menu = await prisma.restaurantMenu.findMany({
    where: { tenantId }
  })
  
  return NextResponse.json({ menu })
}
```

---

## 6. 🔄 Migration Plan for Decoupled Architecture

### Phase 1: Remove Features from CRM (Week 1)

**Actions:**
1. ✅ Remove Projects from CRM
   - Remove from CRM sidebar/top bar
   - Prepare for Projects module creation
   - Data migration plan

2. ✅ Remove Orders from CRM
   - Remove from CRM sidebar/top bar
   - Move to Sales module
   - Update API routes

3. ✅ Remove Products from CRM
   - Remove from CRM sidebar/top bar
   - Move to Inventory module
   - Update API routes

4. ✅ Simplify CRM Navigation
   - Top bar: Home, Leads, Contacts, Accounts, Deals, Tasks, Reports
   - Remove sidebar (or minimal module switcher)

### Phase 2: Create Projects Module (Week 2)

**Actions:**
1. Create new Next.js app: `apps/projects/`
2. Setup subdomain: `projects.payaid.in`
3. Migrate Projects code from CRM
4. Setup SSO integration
5. Setup API Gateway routes
6. Deploy independently

### Phase 3: Reorganize Sales Module (Week 3)

**Actions:**
1. Move Orders from CRM to Sales
2. Update Sales top bar
3. Setup API Gateway for Orders
4. Update SSO redirects

### Phase 4: Create Inventory Module (Week 4)

**Actions:**
1. Create new Next.js app: `apps/inventory/`
2. Setup subdomain: `inventory.payaid.in`
3. Move Products from CRM
4. Setup API Gateway for Products
5. Share Products with Sales via API

---

## 7. 📋 Navigation Implementation for Decoupled Architecture

### Module-Specific Top Bar

**Each Module Implements:**
```typescript
// apps/crm/components/TopBar.tsx
export function CRMTopBar() {
  return (
    <nav className="top-bar">
      <Link href="/crm/home">Home</Link>
      <Link href="/crm/leads">Leads</Link>
      <Link href="/crm/contacts">Contacts</Link>
      <Link href="/crm/accounts">Accounts</Link>
      <Link href="/crm/deals">Deals</Link>
      <Link href="/crm/tasks">Tasks</Link>
      <Link href="/crm/reports">Reports</Link>
      <ModuleSwitcher />
    </nav>
  )
}
```

### Module Switcher Component

**Each Module Has:**
```typescript
// apps/crm/components/ModuleSwitcher.tsx
export function ModuleSwitcher() {
  const modules = [
    { id: 'crm', name: 'CRM', url: 'https://crm.payaid.in', active: true },
    { id: 'finance', name: 'Finance', url: 'https://finance.payaid.in', active: false },
    { id: 'sales', name: 'Sales', url: 'https://sales.payaid.in', active: false },
    // ...
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Switch Module</DropdownMenuTrigger>
      <DropdownMenuContent>
        {modules.map(module => (
          <DropdownMenuItem
            key={module.id}
            onClick={() => {
              // Redirect to module with SSO token
              window.location.href = `${module.url}?token=${getSSOToken()}`
            }}
          >
            {module.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### SSO Token Passing

**When Switching Modules:**
```typescript
// Get SSO token from current module
const token = await getSSOToken()

// Redirect to new module with token
window.location.href = `https://finance.payaid.in?token=${token}`

// New module validates token and creates session
```

---

## 8. ✅ Final Recommendations for Decoupled Architecture

### Navigation Strategy

1. **✅ Top Bar Only** - Module-specific features (horizontal tabs)
2. **✅ Module Switcher** - Dropdown/button to switch modules
3. **❌ No Sidebar** - Or minimal sidebar with module switcher only
4. **✅ SSO Integration** - Seamless module switching with tokens

### Module Classification

1. **✅ Clear Module Boundaries** - Each module is separate app
2. **✅ Independent Features** - No shared features between modules
3. **✅ API Gateway Communication** - Modules communicate via API
4. **✅ Event-Driven Sync** - Use Redis for async events

### Industry Modules

1. **✅ Industry Features in Core Modules** - Enabled via license
2. **✅ Separate Database Tables** - Per industry (e.g., `restaurant_menu`)
3. **✅ API Routes Scoped by Industry** - (e.g., `/api/crm/restaurant/*`)

### Implementation Priority

1. **🔴 High Priority** - Remove Projects/Orders from CRM
2. **🟡 Medium Priority** - Create Projects module app
3. **🟢 Low Priority** - Industry module restructuring

---

## 9. 🎯 Key Differences: Monolithic vs Decoupled

| Aspect | Monolithic (Previous) | Decoupled (Current) |
|--------|----------------------|---------------------|
| **Navigation** | Shared sidebar + top bar | Module-specific top bar only |
| **Module Switching** | Same app, different routes | Different apps, different subdomains |
| **Components** | Shared components | Independent components per module |
| **Database** | One database, shared tables | Separate schemas per module |
| **Deployment** | Single deployment | Independent deployments |
| **Team Structure** | One team | Separate teams per module |

---

## 10. 📊 Alignment Check

### ✅ Strategy Aligned with Decoupled Architecture

**Navigation:**
- ✅ Module-specific top bar (independent per module)
- ✅ Module switcher (cross-domain navigation)
- ✅ No shared sidebar (maintains independence)

**Module Classification:**
- ✅ Clear boundaries (each module = separate app)
- ✅ Independent features (no overlap)
- ✅ API Gateway communication (decoupled)

**Industry Modules:**
- ✅ Feature flags within core modules (no separate apps)
- ✅ License-based enablement (maintains structure)

---

**Status:** ✅ **ALIGNED WITH DECOUPLED ARCHITECTURE**

**Next Steps:** Proceed with Phase 1 implementation (remove Projects/Orders from CRM, create module-specific navigation).

