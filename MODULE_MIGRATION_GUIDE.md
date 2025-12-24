# 📦 Module Migration Guide - Phase 2

**Date:** December 2025  
**Status:** ✅ **READY FOR MIGRATION**  
**Purpose:** Guide for migrating code from monolith to module repositories

---

## 🎯 **Migration Overview**

This guide helps you migrate API routes, frontend pages, and Prisma models from the monolith to individual module repositories.

---

## 📋 **Step-by-Step Migration Process**

### **Step 1: Set Up Module Repository**

1. **Create module directory structure:**
```bash
mkdir -p crm-module/{app/api,app/dashboard,lib,components,prisma}
```

2. **Initialize Next.js project:**
```bash
cd crm-module
npm init -y
npm install next@latest react@latest react-dom@latest
npm install -D typescript @types/react @types/node
```

3. **Install shared packages:**
```bash
npm install @payaid/auth @payaid/types @payaid/db @payaid/ui @payaid/utils @payaid/oauth-client
```

4. **Create `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

5. **Create `next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    CORE_AUTH_URL: process.env.CORE_AUTH_URL || 'http://localhost:3000',
    OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID || 'crm-module',
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

module.exports = nextConfig
```

---

### **Step 2: Create Middleware**

Create `middleware.ts` in module root:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyRequestToken, redirectToAuth } from '@payaid/oauth-client'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth for public routes
  const publicRoutes = ['/api/oauth/callback', '/login', '/_next']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check authentication
  const payload = verifyRequestToken(request)
  if (!payload) {
    return redirectToAuth(request.url)
  }

  // Check module license
  const licensedModules = payload.licensedModules || []
  if (!licensedModules.includes('crm')) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Module not licensed' },
        { status: 403 }
      )
    }
    return NextResponse.redirect(new URL('/upgrade?module=crm', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
```

---

### **Step 3: Create Authentication Helpers**

Create `lib/middleware/auth.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, optionalAuth, AuthMiddlewareResult } from '@payaid/oauth-client'

export function requireCRMAuth(
  request: NextRequest,
  returnUrl?: string
): AuthMiddlewareResult {
  return requireAuth(request, returnUrl)
}

export function requireCRMAccess(request: NextRequest): AuthMiddlewareResult {
  const auth = requireCRMAuth(request)
  
  if (!auth.authenticated) {
    return auth
  }

  // Check CRM module license
  const licensedModules = auth.payload?.licensedModules || []
  if (!licensedModules.includes('crm')) {
    return {
      authenticated: false,
      payload: null,
      response: NextResponse.json(
        { error: 'CRM module not licensed' },
        { status: 403 }
      ),
    }
  }

  return auth
}
```

---

### **Step 4: Migrate API Routes**

For each API route in `app/api/contacts/route.ts`:

**Before (Monolith):**
```typescript
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: Request) {
  const { user, tenantId } = await authenticateRequest(request)
  // ... rest of code
}
```

**After (Module):**
```typescript
import { requireCRMAccess } from '@/lib/middleware/auth'
import { prisma } from '@payaid/db'

export async function GET(request: NextRequest) {
  const auth = requireCRMAccess(request)
  if (!auth.authenticated) {
    return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tenantId } = auth.payload
  // ... rest of code
}
```

**Key Changes:**
1. ✅ Import from `@payaid/db` instead of `@/lib/db/prisma`
2. ✅ Use `requireCRMAccess()` instead of `authenticateRequest()`
3. ✅ Use `NextRequest` instead of `Request`
4. ✅ Check `auth.authenticated` before proceeding
5. ✅ Extract `tenantId` from `auth.payload`

---

### **Step 5: Migrate Prisma Models**

1. **Create module Prisma schema:**
   - Copy only module-specific models from main schema
   - Keep shared models (User, Tenant) in `@payaid/db`

2. **Example `prisma/schema.prisma`:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Module-specific models only
model Contact {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  email     String?
  phone     String?
  // ... other fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
  @@index([email])
}
```

3. **Generate Prisma client:**
```bash
npx prisma generate
```

---

### **Step 6: Migrate Frontend Pages**

For frontend pages in `app/dashboard/contacts/page.tsx`:

**Key Changes:**
1. ✅ Use `@payaid/ui` components instead of local components
2. ✅ Use `@payaid/oauth-client` for authentication
3. ✅ Update API calls to use module's own API routes
4. ✅ Use `usePayAidAuth` hook from `@payaid/auth`

**Example:**
```typescript
'use client'

import { usePayAidAuth } from '@payaid/auth'
import { Button, Card } from '@payaid/ui'

export default function ContactsPage() {
  const { hasModule, tenant } = usePayAidAuth()
  
  if (!hasModule('crm')) {
    return <div>CRM module not licensed</div>
  }
  
  // ... rest of component
}
```

---

### **Step 7: Create OAuth Callback**

Create `app/api/oauth/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, setTokenCookie, setRefreshTokenCookie } from '@payaid/oauth-client'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  try {
    const redirectUri = new URL('/api/oauth/callback', request.url).toString()
    const tokens = await exchangeCodeForTokens(code, redirectUri)

    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    setTokenCookie(response, tokens.access_token)
    if (tokens.refresh_token) {
      setRefreshTokenCookie(response, tokens.refresh_token)
    }

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url))
  }
}
```

---

### **Step 8: Environment Variables**

Create `.env.example`:

```env
# Core Authentication
CORE_AUTH_URL=http://localhost:3000
OAUTH_CLIENT_ID=crm-module
OAUTH_CLIENT_SECRET=your-client-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/payaid_v3

# JWT (should match core)
JWT_SECRET=your-jwt-secret
```

---

## 📊 **Migration Checklist**

### **For Each Module:**

- [ ] Create module directory structure
- [ ] Initialize Next.js project
- [ ] Install shared packages
- [ ] Create `middleware.ts`
- [ ] Create `lib/middleware/auth.ts`
- [ ] Create `app/api/oauth/callback/route.ts`
- [ ] Migrate API routes
- [ ] Update imports (use shared packages)
- [ ] Migrate Prisma models
- [ ] Migrate frontend pages
- [ ] Create `.env.example`
- [ ] Test module independently
- [ ] Test OAuth2 flow
- [ ] Test module license checking

---

## 🧪 **Testing After Migration**

### **1. Test Authentication:**
```bash
# Start module
cd crm-module
npm run dev

# Navigate to http://localhost:3001/dashboard
# Should redirect to core for login
# After login, should redirect back with token
```

### **2. Test API Routes:**
```bash
# Get token from cookie or login
curl http://localhost:3001/api/contacts \
  -H "Cookie: payaid_token=YOUR_TOKEN"
```

### **3. Test License Checking:**
```bash
# Try accessing without CRM license
# Should return 403 error
```

---

## 🚀 **Deployment**

### **Local Development:**
- Core: `http://localhost:3000`
- CRM Module: `http://localhost:3001`
- Invoicing Module: `http://localhost:3002`
- etc.

### **Staging:**
- Core: `https://staging.payaid.io`
- CRM Module: `https://crm.staging.payaid.io`
- Invoicing Module: `https://invoicing.staging.payaid.io`

### **Production:**
- Core: `https://payaid.io`
- CRM Module: `https://crm.payaid.io`
- Invoicing Module: `https://invoicing.payaid.io`

---

## 📝 **Notes**

1. **Database:** All modules share the same database
2. **Tenant Isolation:** Always filter by `tenantId` in queries
3. **License Checking:** Always check module license before allowing access
4. **Token Storage:** Tokens stored in `.payaid.io` domain cookies for cross-subdomain access
5. **Error Handling:** Return proper HTTP status codes and error messages

---

**Status:** ✅ **READY FOR MIGRATION**  
**Next:** Start migrating modules one by one, beginning with CRM

