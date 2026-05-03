# Pending Tasks - MODULE_CLASSIFICATION_STRATEGY_DECOUPLED.md

**Date:** January 2026  
**Status:** 📋 **DETAILED PENDING TASKS ANALYSIS**

---

## ✅ **COMPLETED (Per Document Requirements)**

### **Phase 1: Remove Features from CRM (Week 1)** ✅
- ✅ Projects removed from CRM navigation
- ✅ Orders removed from CRM navigation
- ✅ Products removed from CRM navigation
- ✅ CRM navigation simplified (top bar only)

### **Phase 2: Create Projects Module (Week 2)** ⚠️ **PARTIALLY COMPLETE**
- ✅ Projects module created (`/projects/[tenantId]/Home/`)
- ✅ Projects API routes updated
- ✅ SSO integration (basic - sessionStorage)
- ✅ API Gateway routes created
- ⚠️ **NOT DONE:** Separate Next.js app (`apps/projects/`)
- ⚠️ **NOT DONE:** Subdomain setup (`projects.payaid.in`)
- ⚠️ **NOT DONE:** Independent deployment

### **Phase 3: Reorganize Sales Module (Week 3)** ✅
- ✅ Orders moved to Sales module
- ✅ Sales top bar updated
- ✅ API Gateway for Orders created
- ✅ SSO redirects updated

### **Phase 4: Create Inventory Module (Week 4)** ⚠️ **PARTIALLY COMPLETE**
- ✅ Inventory module created (`/inventory/[tenantId]/Home/`)
- ✅ Products moved from CRM
- ✅ API Gateway for Products created
- ⚠️ **NOT DONE:** Separate Next.js app (`apps/inventory/`)
- ⚠️ **NOT DONE:** Subdomain setup (`inventory.payaid.in`)
- ⚠️ **NOT DONE:** Independent deployment

---

## ⚠️ **PENDING TASKS**

### **🔴 HIGH PRIORITY - Architecture Alignment**

#### **1. Separate Next.js Apps (Per Document)**
**Status:** ⚠️ **NOT STARTED**

**What's Required:**
- Create separate Next.js apps for each module:
  - `apps/crm/` - CRM module app
  - `apps/projects/` - Projects module app
  - `apps/inventory/` - Inventory module app
  - `apps/sales/` - Sales module app
  - `apps/finance/` - Finance module app

**Current State:**
- All modules are routes within single Next.js app:
  - `/crm/[tenantId]/Home/`
  - `/projects/[tenantId]/Home/`
  - `/inventory/[tenantId]/Home/`
  - `/sales/[tenantId]/Home/`

**What Needs to Be Done:**
1. Create monorepo structure (if not exists)
2. Move each module to separate Next.js app
3. Setup shared packages (auth, database, UI components)
4. Update build and deployment scripts
5. Test independent module builds

**Files to Create/Modify:**
- `apps/crm/package.json`
- `apps/projects/package.json`
- `apps/inventory/package.json`
- `apps/sales/package.json`
- `packages/shared-auth/` - Shared auth package
- `packages/shared-db/` - Shared database package
- `packages/shared-ui/` - Shared UI components

---

#### **2. Subdomain Setup (Per Document)**
**Status:** ⚠️ **NOT STARTED**

**What's Required:**
- Each module on separate subdomain:
  - `crm.payaid.in`
  - `projects.payaid.in`
  - `inventory.payaid.in`
  - `sales.payaid.in`
  - `finance.payaid.in`

**Current State:**
- All modules on same domain: `localhost:3000`
- Using routes: `/crm/`, `/projects/`, `/inventory/`, `/sales/`

**What Needs to Be Done:**
1. **DNS Configuration:**
   - Add subdomain records (A or CNAME)
   - Point to server IP or load balancer

2. **Reverse Proxy Setup:**
   - Nginx or Traefik configuration
   - Route subdomains to correct Next.js apps
   - SSL certificate setup (Let's Encrypt)

3. **Environment Variables:**
   - Update `NEXT_PUBLIC_APP_URL` per module
   - Configure CORS for cross-subdomain requests
   - Update SSO redirect URLs

4. **Deployment Pipeline:**
   - Separate deployment per module
   - CI/CD updates for subdomain routing

**Infrastructure Files:**
- `nginx.conf` or `traefik.yml`
- `docker-compose.yml` (if using containers)
- `.env.production` per module

---

### **🟡 MEDIUM PRIORITY - SSO & API Gateway**

#### **3. Full OAuth2 SSO Flow (Per Document)**
**Status:** ⚠️ **PARTIALLY COMPLETE**

**What's Required:**
- OAuth2 flow for cross-subdomain authentication
- Cookie-based SSO (not just sessionStorage)
- Token refresh mechanism
- Secure token passing between subdomains

**Current State:**
- ✅ Basic SSO: Token stored in sessionStorage
- ✅ Module Switcher: Handles navigation
- ⚠️ **NOT DONE:** OAuth2 flow for subdomains
- ⚠️ **NOT DONE:** Cookie-based SSO
- ⚠️ **NOT DONE:** Token refresh

**What Needs to Be Done:**
1. **OAuth2 Provider Setup:**
   - Authorization endpoint (`/api/oauth/authorize`)
   - Token endpoint (`/api/oauth/token`)
   - UserInfo endpoint (`/api/oauth/userinfo`)

2. **OAuth2 Client (Per Module):**
   - Callback endpoint (`/api/oauth/callback`)
   - Token exchange logic
   - Session management

3. **Cookie Configuration:**
   - Set cookies with `domain=.payaid.in` for cross-subdomain
   - Secure, HttpOnly, SameSite settings
   - Token refresh cookies

4. **Module Switcher Update:**
   - Redirect to OAuth2 authorization
   - Handle callback with token
   - Store token in secure cookie

**Files to Create/Modify:**
- `app/api/oauth/authorize/route.ts`
- `app/api/oauth/token/route.ts`
- `app/api/oauth/userinfo/route.ts`
- `app/api/oauth/callback/route.ts` (per module)
- `packages/auth-sdk/client.ts` - Update for OAuth2
- `components/ModuleSwitcher.tsx` - Update for OAuth2 flow

---

#### **4. Redis Event Bus Verification**
**Status:** ⚠️ **NEEDS VERIFICATION**

**What's Required:**
- Redis configured and running
- Event publishing/subscribing working
- Cross-module data sync via events

**Current State:**
- ✅ Event publishing code exists (`/api/events`)
- ⚠️ **NOT VERIFIED:** Redis connection
- ⚠️ **NOT VERIFIED:** Event subscription
- ⚠️ **NOT VERIFIED:** Cross-module sync

**What Needs to Be Done:**
1. **Verify Redis Setup:**
   - Check Redis connection string
   - Test Redis connection
   - Verify Redis is running

2. **Test Event Publishing:**
   - Publish test event
   - Verify event is stored in Redis
   - Check event format

3. **Test Event Subscription:**
   - Subscribe to events
   - Verify events are received
   - Test event handlers

4. **Test Cross-Module Sync:**
   - Create order in Sales module
   - Verify Finance module receives event
   - Test data sync

**Files to Check:**
- `lib/redis/client.ts` - Redis configuration
- `app/api/events/route.ts` - Event publishing
- `.env` - Redis connection string
- Verify Redis service is running

---

#### **5. Additional API Gateway Routes**
**Status:** ⚠️ **PARTIALLY COMPLETE**

**What's Required:**
- Gateway routes for all cross-module data access

**Current State:**
- ✅ Products gateway (`/api/gateway/products`)
- ✅ Orders gateway (`/api/gateway/orders`)
- ✅ Projects gateway (`/api/gateway/projects`)
- ⚠️ **NOT DONE:** Contacts gateway (for Sales)
- ⚠️ **NOT DONE:** Deals gateway (for Finance)
- ⚠️ **NOT DONE:** Accounts gateway (for Sales/Finance)

**What Needs to Be Done:**
1. **Contacts Gateway:**
   - `/api/gateway/contacts/route.ts`
   - Allow Sales module to access Contacts from CRM
   - For order customer selection

2. **Deals Gateway:**
   - `/api/gateway/deals/route.ts`
   - Allow Finance module to access Deals from CRM
   - For invoice creation from deals

3. **Accounts Gateway:**
   - `/api/gateway/accounts/route.ts`
   - Allow Sales/Finance modules to access Accounts
   - For customer management

**Files to Create:**
- `app/api/gateway/contacts/route.ts`
- `app/api/gateway/deals/route.ts`
- `app/api/gateway/accounts/route.ts`

---

### **🟢 LOW PRIORITY - Infrastructure & Polish**

#### **6. Independent Deployment Setup**
**Status:** ⚠️ **NOT STARTED**

**What's Required:**
- Each module can be deployed independently
- Separate CI/CD pipelines
- Independent versioning

**What Needs to Be Done:**
1. **CI/CD Configuration:**
   - Separate GitHub Actions workflows per module
   - Independent build and deploy scripts
   - Module-specific environment variables

2. **Versioning:**
   - Semantic versioning per module
   - Changelog per module
   - Release notes per module

3. **Monitoring:**
   - Separate monitoring per module
   - Module-specific error tracking
   - Performance metrics per module

**Files to Create:**
- `.github/workflows/crm-deploy.yml`
- `.github/workflows/projects-deploy.yml`
- `.github/workflows/inventory-deploy.yml`
- `.github/workflows/sales-deploy.yml`

---

#### **7. Industry Modules Verification**
**Status:** ⚠️ **NEEDS VERIFICATION**

**What's Required:**
- Verify all industry modules are properly integrated
- Test license-based enablement
- Verify industry-specific routes work

**What Needs to Be Done:**
1. **Test Industry Features:**
   - Restaurant module features
   - Retail module features
   - Manufacturing module features
   - Other industry modules

2. **Verify License Checks:**
   - Test with licensed tenant
   - Test with unlicensed tenant
   - Verify error messages

3. **Test Industry Routes:**
   - `/api/crm/restaurant/*`
   - `/api/crm/retail/*`
   - `/api/crm/manufacturing/*`

---

## 📊 **Summary Table**

| Task | Status | Priority | Effort |
|------|--------|----------|--------|
| **Separate Next.js Apps** | ⚠️ Not Started | 🔴 High | Large |
| **Subdomain Setup** | ⚠️ Not Started | 🔴 High | Large |
| **Full OAuth2 SSO** | ⚠️ Partial | 🟡 Medium | Medium |
| **Redis Event Bus** | ⚠️ Needs Verification | 🟡 Medium | Small |
| **Additional Gateway Routes** | ⚠️ Partial | 🟡 Medium | Small |
| **Independent Deployment** | ⚠️ Not Started | 🟢 Low | Medium |
| **Industry Modules Verification** | ⚠️ Needs Verification | 🟢 Low | Small |

---

## 🎯 **Recommended Next Steps**

### **Option A: True Decoupled Architecture (Per Document)**
1. Create separate Next.js apps for each module
2. Setup subdomains
3. Implement full OAuth2 SSO
4. Setup independent deployment

**Timeline:** 2-3 weeks
**Effort:** Large
**Benefit:** True module independence

### **Option B: Route-Based Decoupling (Current)**
1. Keep current route-based structure
2. Enhance SSO for better token management
3. Verify and complete API Gateway routes
4. Add Redis event bus verification

**Timeline:** 1 week
**Effort:** Small-Medium
**Benefit:** Faster implementation, easier maintenance

---

## 💡 **Recommendation**

**Current Implementation (Route-Based):**
- ✅ Works well for development
- ✅ Easier to maintain
- ✅ Faster to implement
- ✅ All modules accessible

**Document Requirement (Subdomain-Based):**
- ✅ True module independence
- ✅ Separate deployments
- ✅ Better scalability
- ⚠️ More complex setup
- ⚠️ Requires infrastructure changes

**Suggestion:**
- **For Now:** Continue with route-based structure (current implementation)
- **For Production:** Plan migration to subdomain-based when ready
- **Priority:** Complete remaining API Gateway routes and verify Redis

---

**Overall Status:** 🟡 **~70% Complete (Route-Based) | ~40% Complete (Subdomain-Based)**

**Key Decision Needed:** Continue with route-based or migrate to subdomain-based architecture?

