# PayAid V3 - Monorepo Structure for Decoupled Architecture

**Date:** January 2026  
**Status:** 📋 **STRUCTURE PLAN**  
**Purpose:** Guide for migrating to separate Next.js apps per module

---

## 🏗️ Proposed Monorepo Structure

```
payaid-v3/
├── apps/
│   ├── landing/              # Landing page (app.payaid.in/home)
│   │   ├── app/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── crm/                  # CRM Module (crm.payaid.in)
│   │   ├── app/
│   │   │   ├── [tenantId]/
│   │   │   │   ├── Home/
│   │   │   │   ├── Leads/
│   │   │   │   ├── Contacts/
│   │   │   │   ├── Accounts/
│   │   │   │   ├── Deals/
│   │   │   │   ├── Tasks/
│   │   │   │   └── Reports/
│   │   │   └── api/
│   │   │       └── crm/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── finance/              # Finance Module (finance.payaid.in)
│   │   ├── app/
│   │   │   ├── [tenantId]/
│   │   │   │   ├── Home/
│   │   │   │   ├── Invoices/
│   │   │   │   ├── Accounting/
│   │   │   │   ├── Purchase-Orders/
│   │   │   │   └── GST/
│   │   │   └── api/
│   │   │       └── finance/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── sales/                # Sales Module (sales.payaid.in)
│   │   ├── app/
│   │   │   ├── [tenantId]/
│   │   │   │   ├── Home/
│   │   │   │   ├── Landing-Pages/
│   │   │   │   ├── Checkout-Pages/
│   │   │   │   └── Orders/
│   │   │   └── api/
│   │   │       └── sales/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── projects/             # Projects Module (projects.payaid.in)
│   │   ├── app/
│   │   │   ├── [tenantId]/
│   │   │   │   ├── Home/
│   │   │   │   ├── Projects/
│   │   │   │   ├── Tasks/
│   │   │   │   ├── Time/
│   │   │   │   ├── Gantt/
│   │   │   │   └── Reports/
│   │   │   └── api/
│   │   │       └── projects/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── inventory/            # Inventory Module (inventory.payaid.in)
│   │   ├── app/
│   │   │   ├── [tenantId]/
│   │   │   │   ├── Home/
│   │   │   │   ├── Products/
│   │   │   │   ├── Warehouses/
│   │   │   │   ├── StockMovements/
│   │   │   │   └── Reports/
│   │   │   └── api/
│   │   │       └── inventory/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── marketing/            # Marketing Module (marketing.payaid.in)
│   │   ├── app/
│   │   │   ├── [tenantId]/
│   │   │   │   ├── Home/
│   │   │   │   ├── Campaigns/
│   │   │   │   ├── Email/
│   │   │   │   ├── Social-Media/
│   │   │   │   └── WhatsApp/
│   │   │   └── api/
│   │   │       └── marketing/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── hr/                   # HR Module (hr.payaid.in)
│       ├── app/
│       │   ├── [tenantId]/
│       │   │   ├── Home/
│       │   │   ├── Employees/
│       │   │   ├── Payroll/
│       │   │   ├── Leave/
│       │   │   └── Attendance/
│       │   └── api/
│       │       └── hr/
│       ├── package.json
│       └── next.config.js
│
├── packages/
│   ├── shared-auth/          # Shared authentication package
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── oauth.ts
│   │   └── package.json
│   │
│   ├── shared-db/            # Shared database package
│   │   ├── src/
│   │   │   ├── prisma.ts
│   │   │   └── schema.ts
│   │   └── package.json
│   │
│   ├── shared-ui/            # Shared UI components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── api-gateway/          # API Gateway client
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   └── events.ts
│   │   └── package.json
│   │
│   └── event-bus/            # Redis Event Bus client
│       ├── src/
│       │   ├── publisher.ts
│       │   └── subscriber.ts
│       └── package.json
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.crm
│   │   ├── Dockerfile.finance
│   │   └── docker-compose.yml
│   ├── nginx/
│   │   └── nginx.conf
│   └── kubernetes/
│       └── deployments/
│
├── package.json              # Root package.json (workspace)
├── pnpm-workspace.yaml       # pnpm workspace config
├── turbo.json                # Turborepo config (optional)
└── README.md

```

---

## 📦 Package Structure

### Root `package.json`
```json
{
  "name": "payaid-v3",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint"
  }
}
```

### Module `package.json` Example (CRM)
```json
{
  "name": "@payaid/crm",
  "version": "1.0.0",
  "dependencies": {
    "@payaid/shared-auth": "workspace:*",
    "@payaid/shared-db": "workspace:*",
    "@payaid/shared-ui": "workspace:*",
    "@payaid/api-gateway": "workspace:*"
  }
}
```

---

## 🔄 Migration Steps

### Phase 1: Setup Monorepo
1. Create `apps/` and `packages/` directories
2. Move current app to `apps/landing/` or keep as root
3. Setup workspace configuration (pnpm/turborepo)

### Phase 2: Extract Shared Packages
1. Create `packages/shared-auth/` from `packages/auth-sdk/`
2. Create `packages/shared-db/` from `lib/db/`
3. Create `packages/shared-ui/` from `components/ui/`

### Phase 3: Create Module Apps
1. Create `apps/crm/` and move CRM routes
2. Create `apps/finance/` and move Finance routes
3. Repeat for other modules

### Phase 4: Update Dependencies
1. Update imports to use shared packages
2. Update API routes to use API Gateway
3. Test each module independently

---

## 🚀 Deployment Strategy

### Option A: Separate Deployments
- Each module deployed independently
- Separate CI/CD pipelines
- Independent scaling

### Option B: Monorepo Deployment
- Single deployment with all modules
- Shared infrastructure
- Easier to manage

---

## 📝 Next Steps

1. **Decide on Monorepo Tool:**
   - pnpm workspaces (recommended)
   - Turborepo (for build optimization)
   - Nx (for advanced features)

2. **Create Shared Packages:**
   - Extract auth logic
   - Extract database logic
   - Extract UI components

3. **Migrate Modules:**
   - Start with one module (CRM)
   - Test thoroughly
   - Migrate others incrementally

---

**Status:** 📋 **PLAN READY FOR IMPLEMENTATION**

