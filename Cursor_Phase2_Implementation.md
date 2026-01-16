# 🚀 CURSOR IMPLEMENTATION PROMPT: PAYAID V3 DECOUPLED ARCHITECTURE (PHASE 2)
## Complete Guide to Build Modular Zoho-Style Platform

**Date:** January 2, 2026  
**Status:** PRODUCTION-READY PROMPT  
**Version:** 1.0  
**For:** Cursor AI / Development Team

---

## 📋 EXECUTIVE BRIEF FOR CURSOR

**What We're Building:**
Transforming PayAid V3 from monolithic (all modules in one dashboard) to **decoupled architecture** where each module is an independent Next.js app with its own backend, database, and team.

**Current State:**
- Monolithic: `app.payaid.in` (all 34 modules bundled)
- Bundle size: ~8-15MB
- Performance: 15-30s load time
- Problem: Can't scale independently, hard for teams to work in parallel

**Target State (After Phase 2):**
- **Landing Page:** `app.payaid.in/home` (module discovery)
- **Core 3 Modules Decoupled:**
  - `crm.payaid.in` (Contacts, Deals, Tasks, Projects, Products, Orders)
  - `finance.payaid.in` (Invoicing, Accounting, Purchase Orders, GST Reports)
  - `sales.payaid.in` (Landing Pages, Checkout Pages, Lead Generation)
- **SSO:** Unified authentication across all modules
- **API Gateway:** Event-driven sync (CRM→Finance, etc)
- **Performance:** 3-5s load time, 92/100 PageSpeed score

**Timeline:** 4 weeks (Phase 2)  
**Team:** 4 developers  
**Budget:** ₹30-40L  
**Outcome:** Enterprise-ready modular architecture, easier team scaling

---

## 🎯 PHASE 2 DETAILED BREAKDOWN

### Week 1: Setup Infrastructure & Landing Page

#### Task 1.1: Create Landing Page Project
```
Create new Next.js 15 project: app.payaid.in/home
Location: /home (not separate domain, same as current app)

Frontend Stack:
- Next.js 15 (App Router)
- React 18 + TypeScript
- TailwindCSS
- Lucide React (icons)

Structure:
app/
├── page.tsx              (Landing page component)
├── layout.tsx            (Root layout + nav)
├── components/
│   ├── ModuleGrid.tsx    (Grid of 34 modules)
│   ├── ModuleCard.tsx    (Individual module card)
│   └── Header.tsx        (Navigation header)
└── lib/
    └── modules.config.ts (Module metadata)

Design:
- Hero section: "Trusted by 500+ Indian Businesses"
- Module grid (3 columns on desktop, 1 on mobile)
- Module cards show:
  * Module icon
  * Module name (CRM, Finance, Sales, etc)
  * Brief description (1 sentence)
  * "Open" button → Redirects to module URL
  * Status badge (Active, Coming Soon, etc)
- Footer with pricing, docs, support

Performance:
- Core Web Vitals: A+
- Preload images
- Code splitting for grid
- Lazy load module cards below fold

Module Data Structure:
```typescript
interface ModuleConfig {
  id: string;              // "crm", "finance", "sales"
  name: string;            // "CRM"
  description: string;     // "Manage customer relationships"
  icon: React.ReactNode;   // Lucide icon
  url: string;             // "https://crm.payaid.in"
  status: "active" | "coming-soon" | "beta";
  category: "core" | "productivity" | "industry" | "ai";
  color: string;           // HEX color for card background
}
```

#### Task 1.2: Setup SSO Infrastructure
```
SSO Provider: Supabase Auth (you already use this)

Central Auth Database:
- Keep existing Supabase Auth
- No changes to user/profile tables
- JWT tokens valid across ALL modules

Configuration Needed:
1. Update Supabase JWT settings:
   - issuer: supabase.payaid.in
   - audience: "*" (all subdomains)
   - expiry: 24 hours

2. Create .env.local for all modules:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://crm.payaid.in (per module)
```

3. Create shared auth package:
   Location: `packages/auth-sdk/`
   
   Purpose: Reusable auth logic for all modules
   
   Exports:
   - `useAuth()` - React hook for auth state
   - `getSessionToken()` - Get JWT token
   - `isAuthenticated()` - Check if user logged in
   - `redirectToLogin()` - Redirect to Supabase login
   - `getUserProfile()` - Get current user profile
   - `logout()` - Sign out user

   Implementation:
   ```typescript
   // packages/auth-sdk/useAuth.ts
   import { createClient } from '@supabase/supabase-js';
   
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
   
   export function useAuth() {
     const [user, setUser] = useState(null);
     const [loading, setLoading] = useState(true);
   
     useEffect(() => {
       // Get session
       supabase.auth.getSession().then(({ data: { session } }) => {
         setUser(session?.user ?? null);
         setLoading(false);
       });
   
       // Listen for auth changes
       const { data: { subscription } } = supabase.auth.onAuthStateChange(
         (event, session) => {
           setUser(session?.user ?? null);
         }
       );
   
       return () => subscription?.unsubscribe();
     }, []);
   
     return { user, loading, supabase };
   }
   ```

#### Task 1.3: Setup API Gateway Infrastructure
```
API Gateway: Node.js + Express (or Next.js API route)
Purpose: Central hub for inter-module communication

Location: api.payaid.in (separate service)
Or: Use existing app.payaid.in/api prefix

Architecture:
- Redis queue for async events
- Webhook handlers for module events
- API routes for synchronous calls

Events to Support:
- CRM module: "contact.created", "deal.won", "order.created"
- Finance module: "invoice.created", "payment.received"
- Sales module: "lead.created", "page_viewed"

Setup Redis:
- Cloud provider: Upstash (free tier available)
- Or: Self-hosted Redis on your infra
- Connection string in env

Example Event Handler (CRM → Finance):
```typescript
// When CRM creates order, notify Finance
supabase
  .from('orders')
  .on('INSERT', (payload) => {
    // Push to API Gateway
    fetch('https://api.payaid.in/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'order.created',
        data: payload.new,
        timestamp: new Date(),
      })
    });
  })
  .subscribe();

// Finance module listens to same event
redis.subscribe('order.created', (message) => {
  // Create invoice for this order
  createInvoice(message.data);
});
```

---

### Week 2: Extract CRM Module

#### Task 2.1: Create CRM Project Infrastructure
```
Create new Next.js 15 project: crm.payaid.in

Structure:
crm.payaid.in/
├── app/
│   ├── layout.tsx                (Root layout)
│   ├── page.tsx                  (Dashboard)
│   ├── (auth)/
│   │   └── login/page.tsx        (Auth redirect)
│   ├── (modules)/
│   │   ├── contacts/
│   │   │   ├── page.tsx          (Contacts list)
│   │   │   ├── [id]/page.tsx     (Contact detail)
│   │   │   └── new/page.tsx      (New contact)
│   │   ├── deals/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── tasks/
│   │   ├── projects/
│   │   ├── products/
│   │   └── orders/
│   └── api/
│       ├── middleware.ts         (Auth + logging)
│       └── crm/
│           ├── contacts/
│           │   ├── route.ts      (GET /api/crm/contacts)
│           │   └── [id]/route.ts (GET/PUT /api/crm/contacts/[id])
│           ├── deals/route.ts
│           ├── tasks/route.ts
│           └── ...
├── lib/
│   ├── db.ts                     (Supabase client, CRM schema only)
│   ├── auth.ts                   (Auth utilities)
│   ├── api-client.ts             (Call other modules)
│   └── validators.ts             (Input validation)
├── components/
│   ├── SidebarNav.tsx            (CRM-specific sidebar)
│   ├── ContactForm.tsx
│   ├── DealPipeline.tsx
│   ├── TaskList.tsx
│   └── ...
├── types/
│   ├── crm.ts                    (CRM data types)
│   └── index.ts
├── .env.local                    (See Task 1.2)
└── package.json

Database Schema (separate from monolithic):
- This CRM instance has its OWN Supabase schema
- Only CRM tables: contacts, deals, tasks, projects, products, orders
- No HR, Finance, Restaurant tables

Supabase Setup:
1. Create new database/schema: "crm"
2. Copy CRM tables from monolithic:
   - contacts
   - deals
   - tasks
   - projects
   - products
   - orders
   
3. Add Row Level Security (RLS) for multi-tenancy:
```sql
-- Enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their organization's data
CREATE POLICY "org_isolation" ON contacts
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM user_profiles 
      WHERE auth.uid() = id
    )
  );
```

4. Migrations:
```bash
# Run existing CRM migrations on new schema
npx supabase migration list
npx supabase db pull --schema crm
```

#### Task 2.2: Create CRM API Endpoints
```
Backend API Routes:

GET /api/crm/contacts
- Returns: Array of contacts
- Auth: JWT required
- Response: { contacts: Contact[], total: number, page: number }

POST /api/crm/contacts
- Creates: New contact
- Body: { name, email, phone, organization_id }
- Response: { id, ...contact }

GET /api/crm/contacts/[id]
- Returns: Single contact with related data
- Auth: JWT required
- Response: Contact with deals, tasks, orders

PUT /api/crm/contacts/[id]
- Updates: Contact
- Body: Partial<Contact>
- Response: Updated contact

DELETE /api/crm/contacts/[id]
- Deletes: Contact (soft delete)
- Response: { success: true }

Similar for: /api/crm/deals, /api/crm/tasks, etc

Middleware: Auth + Logging
```typescript
// app/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Get JWT from header
  const token = request.headers.get('Authorization')?.split(' ')[1];
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Verify token
  const user = await verifyAuth(token);
  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  
  // Attach user to request (for handler)
  request.user = user;
  
  // Log request
  console.log(`${request.method} ${request.nextUrl.pathname}`, {
    userId: user.id,
    timestamp: new Date(),
  });
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/crm/:path*'],
};
```

#### Task 2.3: Copy & Adapt CRM Frontend Code
```
From: app.payaid.in (monolithic)
To: crm.payaid.in

Files to Copy:
1. CRM components:
   - pages/crm/* → app/app/(modules)/contacts/*
   - pages/crm/* → app/app/(modules)/deals/*
   - pages/crm/* → app/app/(modules)/tasks/*
   - pages/crm/* → app/app/(modules)/projects/*
   - pages/crm/* → app/app/(modules)/products/*
   - pages/crm/* → app/app/(modules)/orders/*

2. CRM hooks:
   - hooks/useCRM* → lib/crm-hooks.ts

3. CRM types:
   - types/crm.ts → types/crm.ts

4. CRM utilities:
   - utils/crm* → lib/crm*

Adaptations Needed:
- Replace monolithic database calls with new CRM API calls
  OLD: const contacts = await db.contacts.getAll()
  NEW: const response = await fetch('/api/crm/contacts')
       const { contacts } = await response.json()

- Remove dependencies on other modules (Finance, Sales, HR)
  - Remove: Payment gateway code (belongs to Finance)
  - Remove: Marketing code (belongs to Sales)
  - Remove: HR code (separate module)
  - Keep: Core CRM features only

- Update authentication:
  OLD: useAuthContext() // from App component
  NEW: useAuth() // from packages/auth-sdk

- Update sidebar:
  OLD: Full sidebar with all 34 modules
  NEW: CRM-only sidebar (Contacts, Deals, Tasks, Projects, Products, Orders)

- Add "Go back to apps" button:
  Location: Top right corner
  Action: Navigate to app.payaid.in/home
  Text: "← Back to Apps"

Example Frontend Component:
```typescript
// app/(modules)/contacts/page.tsx
'use client';

import { useAuth } from '@/packages/auth-sdk';
import { useEffect, useState } from 'react';

export default function ContactsPage() {
  const { user, loading } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Fetch contacts from CRM API
    fetch('/api/crm/contacts', {
      headers: {
        'Authorization': `Bearer ${user.id}` // Use JWT
      }
    })
    .then(res => res.json())
    .then(data => setContacts(data.contacts))
    .catch(err => setError(err));
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <header>
        <h1>Contacts</h1>
        <a href="https://app.payaid.in/home">← Back to Apps</a>
      </header>
      
      <main>
        {/* Render contacts */}
        {contacts.map(contact => (
          <ContactCard key={contact.id} contact={contact} />
        ))}
      </main>
    </div>
  );
}
```

---

### Week 3: Extract Finance Module

#### Task 3.1-3.3: Repeat Week 2 Process for Finance
```
Same as CRM extraction, but for Finance:

Project: finance.payaid.in

Copy these modules:
- Invoicing (invoices, templates, payment links)
- Accounting (expenses, PL, balance sheet)
- Purchase Orders (vendors, POs, GRN)
- GST Reports (GSTR-1, GSTR-3B)

Database Schema:
- invoices
- accounting_entries
- purchase_orders
- vendors
- gst_reports
- payments

API Endpoints:
- /api/finance/invoices
- /api/finance/accounting/pnl
- /api/finance/purchase-orders
- /api/finance/gst-reports

Sidebar (Finance only):
- Invoicing
- Accounting
- Purchase Orders
- GST Reports
```

---

### Week 4: Setup Landing Page Redirection & API Gateway

#### Task 4.1: Implement Module Navigation
```
Landing Page (app.payaid.in/home):

User clicks "CRM" card:
1. Browser navigates to crm.payaid.in
2. CRM module checks for JWT token
3. If no token, redirects to Supabase login
4. If token exists, loads CRM dashboard
5. User is automatically logged in (SSO)

Implementation:
```typescript
// components/ModuleCard.tsx
export function ModuleCard({ module }: { module: ModuleConfig }) {
  return (
    <a href={module.url} target="_blank">
      <div className="p-6 border rounded-lg hover:shadow-lg">
        <Icon icon={module.icon} size={32} />
        <h3>{module.name}</h3>
        <p>{module.description}</p>
        <button>Open →</button>
      </div>
    </a>
  );
}

// When user clicks, they're sent to crm.payaid.in
// CRM module has middleware that checks for JWT
// If missing, redirect to login (Supabase handles it)
```

#### Task 4.2: Setup API Gateway Events
```
File: api/events/route.ts

Purpose: Listen for events from modules, trigger actions

Example Flow:
1. User creates order in CRM module
2. CRM posts to API Gateway: 
   POST /api/events
   Body: { event: 'order.created', data: {...} }

3. API Gateway pushes to Redis queue

4. Finance module listens on Redis:
   - Receives: 'order.created' event
   - Action: Creates invoice automatically
   - Sends: POST to Finance API /api/finance/invoices

5. Both modules are in sync (eventual consistency)

Implementation:
```typescript
// api/events/route.ts
import { redis } from '@/lib/redis';

export async function POST(request: Request) {
  const { event, data, timestamp } = await request.json();

  // Log event
  console.log(`Event: ${event}`, data);

  // Push to Redis for subscribers
  await redis.publish(event, JSON.stringify(data));

  // Also handle synchronous cases
  if (event === 'order.created') {
    // Create invoice in Finance
    await fetch('https://finance.payaid.in/api/finance/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': process.env.API_GATEWAY_KEY, // Secret key
      },
      body: JSON.stringify({
        order_id: data.id,
        customer_id: data.customer_id,
        amount: data.total,
      })
    });
  }

  return Response.json({ success: true });
}
```

#### Task 4.3: Deployment Configuration
```
Deploy to Vercel:

1. Create Vercel projects:
   - app-payaid-home (landing page)
   - app-payaid-crm (CRM module)
   - app-payaid-finance (Finance module)
   - app-payaid-sales (Sales module)

2. Configure domains:
   - app.payaid.in/home → app-payaid-home project
   - crm.payaid.in → app-payaid-crm project
   - finance.payaid.in → app-payaid-finance project
   - sales.payaid.in → app-payaid-sales project

3. Environment variables (per project):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_API_GATEWAY_URL (for all modules)
   - REDIS_URL
   - API_GATEWAY_KEY (secret)

4. GitHub setup:
   - Main repo: payaid-v3-decoupled
   - Monorepo structure:
     apps/
     ├── landing/
     ├── crm/
     ├── finance/
     ├── sales/
     └── api-gateway/
     packages/
     ├── auth-sdk/
     ├── ui-components/
     └── types/

5. CI/CD (GitHub Actions):
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy landing to Vercel
        run: |
          cd apps/landing
          vercel --token ${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy CRM to Vercel
        run: |
          cd apps/crm
          vercel --token ${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy Finance to Vercel
        run: |
          cd apps/finance
          vercel --token ${{ secrets.VERCEL_TOKEN }}
      
      - name: Run tests
        run: npm run test
```

---

## 🏁 EXECUTION INSTRUCTIONS FOR CURSOR

### Phase 2 Complete Prompt to Paste

```
You are building PayAid V3 Decoupled Architecture (Phase 2).

CURRENT STATE:
- PayAid has monolithic app at app.payaid.in with 34 modules
- We're extracting 3 core modules into separate Next.js apps
- Target: Modular Zoho-like platform with SSO + API gateway

GOAL:
Transform app.payaid.in → separate modules:
1. Landing page (app.payaid.in/home) - Module discovery
2. CRM (crm.payaid.in) - Contacts, Deals, Tasks, Projects, Products, Orders
3. Finance (finance.payaid.in) - Invoicing, Accounting, POs, GST
4. Sales (sales.payaid.in) - Landing Pages, Checkout Pages
5. API Gateway + SSO infrastructure

TIMELINE: 4 weeks
TEAM: You (Cursor) working with 3 developers
BUDGET: ₹30-40L

WEEK 1 TASKS:
[ ] Task 1.1: Create landing page at app.payaid.in/home
    - Module grid (3 columns)
    - Module cards with icons + descriptions
    - Click card → Redirects to module URL
    - Design: Clean, enterprise, Zoho-like
    
[ ] Task 1.2: Setup SSO infrastructure
    - Configure Supabase Auth for all subdomains
    - Create auth-sdk package (packages/auth-sdk/)
    - Export: useAuth(), getSessionToken(), isAuthenticated()
    
[ ] Task 1.3: Setup API Gateway
    - Create api.payaid.in service
    - Setup Redis queue (Upstash or self-hosted)
    - Create event handlers (order.created → invoice.created)

WEEK 2 TASKS (CRM Extraction):
[ ] Task 2.1: Create crm.payaid.in project
    - Setup folder structure (see above)
    - Configure Supabase schema (CRM tables only)
    - Setup RLS for multi-tenancy
    
[ ] Task 2.2: Build CRM API endpoints
    - /api/crm/contacts (GET, POST, PUT, DELETE)
    - /api/crm/deals
    - /api/crm/tasks
    - /api/crm/projects
    - /api/crm/products
    - /api/crm/orders
    - Auth middleware on all endpoints
    
[ ] Task 2.3: Copy & adapt CRM frontend
    - Copy components from monolithic
    - Replace DB calls with API calls
    - Remove non-CRM dependencies
    - Add "Back to Apps" button

WEEK 3 TASKS (Finance Extraction):
[ ] Task 3.1-3.3: Repeat Week 2 for Finance module
    - finance.payaid.in
    - Invoicing, Accounting, POs, GST
    - Same structure as CRM

WEEK 4 TASKS (Integration):
[ ] Task 4.1: Implement module navigation
    - Landing page → Module links working
    - SSO passing JWT across subdomains
    - Auto-login working
    
[ ] Task 4.2: Setup API Gateway events
    - CRM creates order → Event to API Gateway
    - API Gateway → Finance creates invoice
    - Eventual consistency working
    
[ ] Task 4.3: Deploy to Vercel
    - Create 4 Vercel projects
    - Setup domains
    - Deploy all modules
    - Test end-to-end flow

ACCEPTANCE CRITERIA:
✅ Landing page loads at app.payaid.in/home
✅ Click "CRM" → Navigate to crm.payaid.in
✅ CRM loads with auto-login (SSO)
✅ All CRM APIs working (/api/crm/*)
✅ Finance module same as CRM
✅ Create order in CRM → Invoice auto-created in Finance
✅ Performance: Page loads in <5 seconds
✅ PageSpeed score: 90+/100
✅ All modules deployed to Vercel
✅ No broken links or 404s

TECH STACK:
- Frontend: Next.js 15, React 18, TypeScript, TailwindCSS
- Backend: Next.js API routes
- Database: Supabase (separate schema per module)
- Auth: Supabase Auth (JWT-based)
- Cache/Queue: Redis (Upstash)
- Hosting: Vercel (separate project per module)
- Monitoring: Vercel Analytics + DataDog

DATABASE APPROACH:
- NOT: One big database with all tables
- YES: Separate Supabase schemas
  - auth_schema: Users + auth (shared)
  - crm_schema: CRM tables only
  - finance_schema: Finance tables only
  - sales_schema: Sales tables only

COMMUNICATION BETWEEN MODULES:
- NOT: Direct database queries across modules
- YES: API calls + Events
  - CRM needs Finance data? → Call /api/finance/...
  - CRM creates something? → Post to /events (Redis)
  - Finance listens → Reacts to CRM events

EXISTING CODE REUSE:
- You have monolithic app at app.payaid.in with all code
- Copy CRM code → crm.payaid.in (adapt as needed)
- Copy Finance code → finance.payaid.in (adapt as needed)
- Copy Sales code → sales.payaid.in (adapt as needed)
- Don't rebuild from scratch, refactor existing code

FOLDER STRUCTURE:
payaid-v3-decoupled/
├── apps/
│   ├── landing/              (app.payaid.in/home)
│   │   ├── app/
│   │   │   ├── page.tsx      (Landing page)
│   │   │   ├── layout.tsx
│   │   │   └── api/
│   │   ├── components/
│   │   └── lib/
│   │
│   ├── crm/                  (crm.payaid.in)
│   │   ├── app/
│   │   │   ├── page.tsx      (Dashboard)
│   │   │   ├── layout.tsx
│   │   │   ├── (modules)/
│   │   │   │   ├── contacts/
│   │   │   │   ├── deals/
│   │   │   │   ├── tasks/
│   │   │   │   ├── projects/
│   │   │   │   ├── products/
│   │   │   │   └── orders/
│   │   │   └── api/
│   │   │       └── crm/
│   │   │           ├── contacts/
│   │   │           ├── deals/
│   │   │           └── ...
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   │
│   ├── finance/              (finance.payaid.in)
│   │   ├── (same structure as CRM)
│   │
│   ├── sales/                (sales.payaid.in)
│   │   ├── (same structure as CRM)
│   │
│   └── api-gateway/          (api.payaid.in, optional)
│       ├── routes/
│       │   └── events.ts     (Handle events)
│       └── lib/
│           └── redis.ts
│
├── packages/
│   ├── auth-sdk/             (Reusable auth logic)
│   │   ├── index.ts
│   │   ├── useAuth.ts
│   │   └── client.ts
│   │
│   ├── types/                (Shared TypeScript types)
│   │   ├── crm.ts
│   │   ├── finance.ts
│   │   └── index.ts
│   │
│   └── ui-components/        (Reusable components)
│       ├── Button.tsx
│       ├── Card.tsx
│       └── ...
│
├── .github/
│   └── workflows/
│       └── deploy.yml        (Auto-deploy to Vercel)
│
└── package.json              (Monorepo root)

BUILD OUTPUT:
- Landing deployed to: app.payaid.in/home
- CRM deployed to: crm.payaid.in
- Finance deployed to: finance.payaid.in
- Sales deployed to: sales.payaid.in
- User workflow:
  1. Visit app.payaid.in/home
  2. See module grid
  3. Click "CRM"
  4. Navigate to crm.payaid.in
  5. Auto-logged in via SSO
  6. See CRM dashboard

TESTING:
- Unit: Jest for API endpoints
- E2E: Playwright for user flows
- Load: k6 for performance
- Security: OWASP ZAP scan

TEST CHECKLIST:
- [ ] Landing page loads <3s
- [ ] Click module → Redirect works
- [ ] CRM auto-login works
- [ ] All CRUD operations work
- [ ] Auth middleware blocks unauthorized access
- [ ] Cross-module events work (order → invoice)
- [ ] RLS policies enforce org isolation
- [ ] Performance meets Core Web Vitals A
- [ ] No console errors
- [ ] Works on mobile

DEPLOYMENT CHECKLIST:
- [ ] All .env variables set in Vercel
- [ ] Domains configured (crm.payaid.in, etc)
- [ ] SSL certificates valid
- [ ] CORS configured for API calls
- [ ] Redis/API Gateway accessible from all modules
- [ ] Monitoring alerts setup
- [ ] Backup strategy implemented
- [ ] Rollback plan ready

SUCCESS CRITERIA (After Week 4):
✅ 4 separate Next.js apps deployed to Vercel
✅ Landing page module discovery working
✅ SSO working across all modules
✅ CRM, Finance, Sales modules independent
✅ API Gateway syncing data between modules
✅ Page load time <5 seconds
✅ PageSpeed 90+/100
✅ All team members can work in parallel (no merge conflicts)
✅ Ready to add more modules in decoupled architecture
✅ Enterprise customers impressed with architecture

GO!
```

---

## 🔧 SPECIFIC CODE EXAMPLES FOR CURSOR

### Example 1: Auth Middleware
```typescript
// lib/auth.ts
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function verifyAuth(token: string) {
  try {
    const secret = new TextEncoder().encode(
      process.env.SUPABASE_JWT_SECRET || ''
    );
    const verified = await jwtVerify(token, secret);
    return verified.payload;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: Request) {
  const token = request.headers.get('Authorization')?.split(' ')[1];

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401 }
    );
  }

  const user = await verifyAuth(token);
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401 }
    );
  }

  return { user };
}
```

### Example 2: API Route with Auth
```typescript
// app/api/crm/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { supabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Verify auth
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await verifyAuth(token);
  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Fetch contacts for this user's organization
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', user.org_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contacts: data, total: data.length });
}

export async function POST(request: NextRequest) {
  // Verify auth (same as above)
  ...
  
  const body = await request.json();

  // Create new contact
  const { data, error } = await supabase
    .from('contacts')
    .insert([{
      name: body.name,
      email: body.email,
      organization_id: user.org_id,
    }])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Emit event: contact.created
  await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'contact.created',
      data: data[0],
    })
  });

  return NextResponse.json(data[0], { status: 201 });
}
```

### Example 3: useAuth Hook
```typescript
// packages/auth-sdk/useAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (!session) {
        // Redirect to login
        window.location.href = `https://app.payaid.in/auth/login?redirect=${window.location.href}`;
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return {
    user,
    session,
    loading,
    error,
    logout,
    getToken: () => session?.access_token,
  };
}
```

---

## 📊 SUCCESS METRICS (Week 4+)

Track These Metrics:

```
Performance:
- Landing page load time: < 3 seconds
- CRM module load time: < 5 seconds
- API response time: < 200ms
- Database query time: < 100ms

Reliability:
- Uptime: 99.9%
- Error rate: < 0.1%
- Failed deployments: 0

User Experience:
- PageSpeed score: 90+/100
- Core Web Vitals: Green
- Mobile satisfaction: > 90%

Development:
- Deployment time per module: < 10 minutes
- Test coverage: > 80%
- Merge conflicts: 0 (separate modules)
- Release cycle: Daily per module vs weekly monolithic

Business:
- Customer NPS: 70+ (vs 35 monolithic)
- Churn rate: 3-5% (vs 8-12% monolithic)
- Enterprise deal velocity: +50%
```

---

## 🚀 NEXT STEPS (After Phase 2)

**Phase 3: Add More Modules (Month 6+)**
- HR module (hr.payaid.in)
- Analytics (analytics.payaid.in)
- AI Studio (aistudio.payaid.in)
- Each module same structure as CRM/Finance

**Phase 4: Enterprise Features (Month 9+)**
- Multi-tenant admin portal
- Custom branding
- Advanced reporting
- API marketplace

**Phase 5: Scale (Month 12+)**
- 50k+ customers
- Multiple data centers
- CDN for global delivery
- Advanced compliance (HIPAA, SOC 2)

---

## 📞 SUPPORT & QUESTIONS

If Cursor asks:
- "What database schema should each module have?" → See PART 2, Task 2.1
- "How do modules communicate?" → See PART 4, Task 4.2 (API Gateway)
- "How does SSO work across subdomains?" → See PART 1, Task 1.2
- "How do I handle merge conflicts?" → You won't - separate modules!
- "What about shared components?" → Use packages/ui-components/

---

## ✅ FINAL CHECKLIST FOR CURSOR

Before marking Phase 2 complete:

```
Landing Page:
- [ ] Module grid displays all 34 modules
- [ ] Cards have icons + descriptions
- [ ] Click card redirects to module URL
- [ ] Load time < 3 seconds
- [ ] Mobile responsive

SSO:
- [ ] JWT token valid across subdomains
- [ ] Auto-redirect to login if not authenticated
- [ ] Session persists across module navigation
- [ ] Logout works globally

CRM Module:
- [ ] All CRUD endpoints working (/api/crm/*)
- [ ] Frontend loads at crm.payaid.in
- [ ] Components display correctly
- [ ] Sidebar shows CRM-only modules
- [ ] "Back to Apps" button works

Finance Module:
- [ ] Same quality as CRM
- [ ] /api/finance/* endpoints working
- [ ] Finance-only sidebar
- [ ] Auto-redirect back to landing

Sales Module:
- [ ] Same quality as CRM + Finance
- [ ] Sales-only sidebar
- [ ] All features working

API Gateway:
- [ ] Events working (order.created → invoice)
- [ ] Redis queue operational
- [ ] Eventual consistency achieved
- [ ] No data loss in async flow

Deployment:
- [ ] 4 Vercel projects created + live
- [ ] Domains configured correctly
- [ ] SSL certificates valid
- [ ] No console errors in any module
- [ ] All APIs accessible

Testing:
- [ ] End-to-end flow tested
- [ ] SSO tested
- [ ] Cross-module events tested
- [ ] Performance tested
- [ ] Mobile tested

Documentation:
- [ ] README with setup instructions
- [ ] API documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide
```

---

**Version:** 1.0  
**Date:** January 2, 2026  
**Status:** READY FOR CURSOR  
**Estimated Duration:** 4 weeks  
**Expected Output:** Production-ready decoupled platform  

**Let's build this. 🚀**
