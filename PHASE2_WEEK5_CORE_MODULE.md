# 🚀 Phase 2: Week 5 - Core Module Implementation

**Date:** December 2025  
**Status:** ⏳ **IN PROGRESS**  
**Goal:** Create payaid-core repository and migrate core functionality

---

## 📋 **Week 5 Tasks**

### **Task 1: Set Up Workspace** ✅
- [x] Create build script for packages
- [ ] Build all shared packages
- [ ] Verify packages are ready

### **Task 2: Create Core Repository Structure** ⏳
- [ ] Create directory structure
- [ ] Initialize Next.js project
- [ ] Set up package.json with shared packages
- [ ] Configure TypeScript
- [ ] Set up environment variables

### **Task 3: Migrate Auth Routes** ⏳
- [ ] `/api/auth/login` - User login
- [ ] `/api/auth/register` - User registration
- [ ] `/api/auth/me` - Get current user
- [ ] `/api/auth/oauth/*` - OAuth routes (if exists)

### **Task 4: Migrate Admin Routes** ⏳
- [ ] `/api/admin/tenants/[tenantId]/modules` - Module management
- [ ] `/api/admin/reset-password` - Password reset

### **Task 5: Migrate Settings Routes** ⏳
- [ ] `/api/settings/profile` - User profile
- [ ] `/api/settings/tenant` - Tenant settings
- [ ] `/api/settings/invoices` - Invoice settings
- [ ] `/api/settings/payment-gateway` - Payment gateway settings

### **Task 6: Implement OAuth2 Provider** ⏳
- [ ] `/api/oauth/authorize` - Authorization endpoint
- [ ] `/api/oauth/token` - Token exchange endpoint
- [ ] `/api/oauth/userinfo` - User info endpoint

---

## 📁 **Core Repository Structure**

```
payaid-core/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── README.md
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.ts
│   │   │   ├── register/
│   │   │   │   └── route.ts
│   │   │   ├── me/
│   │   │   │   └── route.ts
│   │   │   └── oauth/
│   │   │       ├── authorize/
│   │   │       │   └── route.ts
│   │   │       ├── token/
│   │   │       │   └── route.ts
│   │   │       └── userinfo/
│   │   │           └── route.ts
│   │   ├── admin/
│   │   │   ├── tenants/
│   │   │   │   └── [tenantId]/
│   │   │   │       └── modules/
│   │   │   │           └── route.ts
│   │   │   └── reset-password/
│   │   │       └── route.ts
│   │   └── settings/
│   │       ├── profile/
│   │       │   └── route.ts
│   │       ├── tenant/
│   │       │   └── route.ts
│   │       ├── invoices/
│   │       │   └── route.ts
│   │       └── payment-gateway/
│   │           └── route.ts
│   ├── dashboard/
│   │   ├── admin/
│   │   │   └── modules/
│   │   │       └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── page.tsx (main dashboard)
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── app-store/
│   │   └── page.tsx (Phase 3)
│   ├── layout.tsx
│   └── page.tsx (landing page)
├── lib/
│   └── redis/
│       └── client.ts (if needed for OAuth2)
├── prisma/
│   └── schema.prisma (core models only)
└── middleware.ts (if needed)
```

---

## 🔧 **Implementation Steps**

### **Step 1: Build Shared Packages**

```bash
cd packages
npm install
npx tsx ../scripts/build-packages.ts
```

### **Step 2: Create Core Repository**

Create the directory structure and initialize Next.js project.

### **Step 3: Migrate Code**

Copy and adapt routes from main repository to use shared packages.

### **Step 4: Implement OAuth2**

Create OAuth2 provider endpoints for cross-module authentication.

---

**Status:** ⏳ **IN PROGRESS**
