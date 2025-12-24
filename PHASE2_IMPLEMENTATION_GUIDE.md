# 🚀 Phase 2: Separate Deployments - Implementation Guide

**Date:** December 2025  
**Status:** ⏳ **IN PROGRESS**  
**Timeline:** Weeks 4-10 (7 weeks)

---

## 🎯 **Phase 2 Overview**

**Goal:** Split the monolith into 6 independent modules + 1 core, each deployable separately with shared authentication.

**Outcome:** 
- 7 separate repositories
- 5 shared npm packages
- OAuth2 SSO for cross-module authentication
- Each module on its own subdomain
- Independent scaling and deployment

---

## ✅ **What's Been Created**

### **1. Codebase Analysis** ✅
- ✅ `PHASE2_CODEBASE_ANALYSIS.md` - Complete module mapping
- ✅ All API routes classified
- ✅ All frontend pages classified
- ✅ All Prisma models classified
- ✅ Dependency map created

### **2. Shared Packages Structure** ✅
- ✅ `packages/@payaid/auth/` - Authentication package
- ✅ `packages/@payaid/types/` - TypeScript types
- ✅ `packages/@payaid/db/` - Database client (core models)

---

## 📦 **Shared Packages Created**

### **1. @payaid/auth** ✅

**Location:** `packages/@payaid/auth/`

**Contents:**
- ✅ JWT signing/verification (`jwt.ts`)
- ✅ Password hashing (`password.ts`)
- ✅ License checking (`license.ts`)
- ✅ React hook (`hooks.ts`)
- ✅ Package configuration

**Usage in modules:**
```typescript
import { requireModuleAccess, handleLicenseError } from '@payaid/auth'
import { usePayAidAuth } from '@payaid/auth'

// In API route:
const { tenantId } = await requireModuleAccess(request, 'crm')

// In React component:
const { hasModule } = usePayAidAuth({ token, tenant })
```

---

### **2. @payaid/types** ✅

**Location:** `packages/@payaid/types/`

**Contents:**
- ✅ User, Tenant, Subscription interfaces
- ✅ ModuleDefinition interface
- ✅ JWTPayload interface
- ✅ LicenseInfo interface
- ✅ API response types

**Usage:**
```typescript
import type { User, Tenant, ModuleId } from '@payaid/types'
```

---

### **3. @payaid/db** ✅

**Location:** `packages/@payaid/db/`

**Contents:**
- ✅ Prisma client singleton
- ✅ Core schema (User, Tenant, Subscription, ModuleDefinition)
- ✅ Type exports

**Usage:**
```typescript
import { prisma } from '@payaid/db'
import type { Tenant, User } from '@payaid/db'
```

---

## ⏳ **What Needs to Be Created**

### **4. @payaid/ui** ⏳

**Location:** `packages/@payaid/ui/`

**Files to Extract:**
- `components/ui/*` - Button, Card, Input, Table, etc.
- `components/layout/*` - Header, Sidebar
- `components/modules/ModuleGate.tsx`
- `components/auth/protected-route.tsx`

---

### **5. @payaid/utils** ⏳

**Location:** `packages/@payaid/utils/`

**Files to Extract:**
- `lib/utils/cn.ts` - Class name utility
- `lib/utils/indian-states.ts` - Indian states data
- `lib/utils/tenant-routes.ts` - Tenant routing
- `lib/encryption.ts` - Encryption utilities

---

## 🔐 **OAuth2 SSO Implementation**

### **Architecture:**

```
User Flow:
1. User logs in at payaid.io (core)
2. Core generates OAuth2 authorization code
3. User navigates to crm.payaid.io
4. CRM redirects to core for auth
5. Core validates and returns JWT token
6. CRM stores token in cookie (.payaid.io domain)
7. All subsequent requests use token
```

### **Implementation Plan:**

#### **1. Core Module - OAuth2 Provider**

**Create:** `app/api/oauth/authorize/route.ts`
```typescript
// Generate authorization code
// Store in Redis with 5min expiry
// Redirect to module callback URL
```

**Create:** `app/api/oauth/token/route.ts`
```typescript
// Exchange authorization code for JWT token
// Return token to module
```

**Create:** `app/api/oauth/userinfo/route.ts`
```typescript
// Return user info from JWT token
// Used by modules to get user details
```

#### **2. Module - OAuth2 Client**

**Create:** `lib/auth/oauth-client.ts`
```typescript
// Redirect to core for auth
// Exchange code for token
// Store token in cookie
```

**Create:** `middleware.ts` (Next.js middleware)
```typescript
// Check for token in cookie
// If missing, redirect to core for auth
// If present, validate and allow access
```

---

## 📁 **Module Repository Templates**

### **Template Structure:**

Each module repository will have:

```
module-name/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── README.md
├── app/
│   ├── api/
│   │   └── [module-routes]/
│   ├── dashboard/
│   │   └── [module-pages]/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── [module-components]/
├── lib/
│   └── [module-utilities]/
├── prisma/
│   └── schema.prisma (module models only)
└── middleware.ts (OAuth2 client)
```

---

## 🔄 **Migration Strategy**

### **Step 1: Create Shared Packages** (Week 4-5)
1. ✅ Create @payaid/auth package
2. ✅ Create @payaid/types package
3. ✅ Create @payaid/db package
4. ⏳ Create @payaid/ui package
5. ⏳ Create @payaid/utils package
6. ⏳ Publish packages to npm (or use local packages)

### **Step 2: Create Module Repositories** (Week 5-6)
1. ⏳ Create GitHub repositories for each module
2. ⏳ Initialize Next.js projects
3. ⏳ Set up shared package dependencies
4. ⏳ Create basic structure

### **Step 3: Migrate Code** (Week 6-7)
1. ⏳ Copy module-specific API routes
2. ⏳ Copy module-specific frontend pages
3. ⏳ Copy module-specific Prisma models
4. ⏳ Update imports to use shared packages
5. ⏳ Test each module independently

### **Step 4: Implement OAuth2 SSO** (Week 7-8)
1. ⏳ Implement OAuth2 provider in core
2. ⏳ Implement OAuth2 client in each module
3. ⏳ Test cross-module authentication
4. ⏳ Test token refresh

### **Step 5: Deploy to Staging** (Week 8-9)
1. ⏳ Deploy core to payaid.staging.payaid.io
2. ⏳ Deploy modules to subdomains
3. ⏳ Set up DNS routing
4. ⏳ Test end-to-end flows

### **Step 6: Production Deployment** (Week 10)
1. ⏳ Deploy to production
2. ⏳ Monitor and optimize
3. ⏳ Document deployment process

---

## 📋 **Detailed Implementation Checklist**

### **Week 4: Preparation** ⏳
- [x] Codebase analysis complete
- [x] Shared packages structure created
- [ ] Create @payaid/ui package
- [ ] Create @payaid/utils package
- [ ] Set up package publishing (npm or local)

### **Week 5: Core Module** ⏳
- [ ] Create payaid-core repository
- [ ] Migrate auth routes
- [ ] Migrate admin routes
- [ ] Migrate settings routes
- [ ] Implement OAuth2 provider
- [ ] Test core module standalone

### **Week 6: CRM & Invoicing Modules** ⏳
- [ ] Create payaid-crm repository
- [ ] Migrate CRM API routes
- [ ] Migrate CRM frontend pages
- [ ] Migrate CRM Prisma models
- [ ] Implement OAuth2 client
- [ ] Test CRM module
- [ ] Repeat for payaid-invoicing

### **Week 7: Remaining Modules** ⏳
- [ ] Create payaid-accounting repository
- [ ] Create payaid-hr repository
- [ ] Create payaid-whatsapp repository
- [ ] Create payaid-analytics repository
- [ ] Migrate code for each
- [ ] Test each module

### **Week 8: Integration Testing** ⏳
- [ ] Test OAuth2 SSO flow
- [ ] Test cross-module navigation
- [ ] Test license checking across modules
- [ ] Test data consistency
- [ ] Performance testing

### **Week 9: Staging Deployment** ⏳
- [ ] Deploy all modules to staging
- [ ] Set up DNS routing
- [ ] Test with real users
- [ ] Fix issues
- [ ] Performance optimization

### **Week 10: Production** ⏳
- [ ] Deploy to production
- [ ] Monitor metrics
- [ ] Document deployment
- [ ] Create runbooks

---

## 🔧 **Next Steps**

1. **Complete Shared Packages:**
   - [ ] Create @payaid/ui package
   - [ ] Create @payaid/utils package
   - [ ] Test packages locally

2. **Create Module Templates:**
   - [ ] Create repository templates
   - [ ] Create migration scripts
   - [ ] Create setup guides

3. **Implement OAuth2:**
   - [ ] Create OAuth2 provider in core
   - [ ] Create OAuth2 client library
   - [ ] Test SSO flow

4. **Start Migration:**
   - [ ] Begin with core module
   - [ ] Then CRM module
   - [ ] Then other modules

---

**Status:** ⏳ **IN PROGRESS - Week 4 Complete**  
**Next:** Create remaining shared packages and module templates
