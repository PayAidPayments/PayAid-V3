# 📁 Phase 2: Module Repository Templates

**Date:** December 2025  
**Status:** ⏳ **PENDING**  
**Purpose:** Templates and guides for creating module repositories

---

## 🎯 **Module Repository Structure**

Each module will be a separate Next.js application with the following structure:

```
module-name/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── README.md
├── middleware.ts (OAuth2 client)
├── app/
│   ├── api/
│   │   └── [module-routes]/
│   ├── dashboard/
│   │   └── [module-pages]/
│   ├── api/
│   │   └── oauth/
│   │       └── callback/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── [module-components]/
├── lib/
│   └── [module-utilities]/
└── prisma/
    └── schema.prisma (module models only)
```

---

## 📦 **Package.json Template**

```json
{
  "name": "payaid-crm",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "eslint .",
    "db:generate": "prisma generate",
    "db:push": "prisma db push"
  },
  "dependencies": {
    "@payaid/auth": "^1.0.0",
    "@payaid/types": "^1.0.0",
    "@payaid/db": "^1.0.0",
    "@payaid/ui": "^1.0.0",
    "@payaid/utils": "^1.0.0",
    "@payaid/oauth-client": "^1.0.0",
    "@prisma/client": "^5.19.0",
    "@tanstack/react-query": "^5.56.0",
    "next": "^16.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^4.5.7",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "prisma": "^5.19.0",
    "typescript": "^5.5.0"
  }
}
```

---

## ⚙️ **Next.js Config Template**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Module-specific config
  env: {
    MODULE_ID: 'crm',
    CORE_AUTH_URL: process.env.CORE_AUTH_URL || 'https://payaid.io',
  },
  
  // Rewrites for API calls to core
  async rewrites() {
    return [
      {
        source: '/api/core/:path*',
        destination: `${process.env.CORE_AUTH_URL}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
```

---

## 🔐 **Middleware Template**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyRequestToken, redirectToAuth } from '@payaid/oauth-client'

const MODULE_ID = 'crm' // Change per module

export async function middleware(request: NextRequest) {
  // Skip auth for public routes
  const publicPaths = ['/api/oauth/callback', '/login', '/_next', '/favicon.ico']
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Check for token
  const payload = verifyRequestToken(request)
  
  if (!payload) {
    // No token - redirect to core for auth
    const returnUrl = request.url
    return redirectToAuth(returnUrl)
  }
  
  // Check module license
  const licensedModules = payload.licensedModules || []
  if (!licensedModules.includes(MODULE_ID)) {
    // Module not licensed - redirect to app store
    return NextResponse.redirect(`${process.env.CORE_AUTH_URL}/app-store?module=${MODULE_ID}`)
  }
  
  // Token valid and module licensed - allow request
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
}
```

---

## 📄 **API Route Template**

```typescript
// app/api/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@payaid/auth'
import { prisma } from '@payaid/db'

export async function GET(request: NextRequest) {
  try {
    // Check module license
    const { tenantId } = await requireModuleAccess(request, 'crm')
    
    // Your module logic here
    const contacts = await prisma.contact.findMany({
      where: { tenantId },
    })
    
    return NextResponse.json({ contacts })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 🎨 **Page Template**

```typescript
// app/dashboard/contacts/page.tsx
'use client'

import { ModuleGate } from '@payaid/ui'
import { usePayAidAuth } from '@payaid/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@payaid/ui'

export default function ContactsPage() {
  const { token, tenant } = usePayAidAuth()
  
  return (
    <ModuleGate module="crm" token={token} tenant={tenant}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Your content here */}
          </CardContent>
        </Card>
      </div>
    </ModuleGate>
  )
}
```

---

## 🗄️ **Prisma Schema Template (Module-Specific)**

```prisma
// prisma/schema.prisma (for payaid-crm)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Only CRM-specific models
model Contact {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  email     String?
  phone     String?
  // ... other CRM fields
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
}

model Deal {
  id        String   @id @default(cuid())
  tenantId  String
  // ... CRM fields
  
  @@index([tenantId])
}

// ... other CRM models
```

---

## 📝 **README Template**

```markdown
# PayAid CRM Module

Independent CRM module for PayAid platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up database:
```bash
npm run db:generate
npm run db:push
```

4. Run development server:
```bash
npm run dev
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `CORE_AUTH_URL` - Core module URL (https://payaid.io)
- `OAUTH_CLIENT_ID` - OAuth2 client ID
- `OAUTH_CLIENT_SECRET` - OAuth2 client secret
- `JWT_SECRET` - JWT secret (must match core)
- `NEXT_PUBLIC_MODULE_URL` - This module's URL (https://crm.payaid.io)

## Dependencies

- `@payaid/auth` - Authentication utilities
- `@payaid/types` - Shared types
- `@payaid/db` - Database client (core models)
- `@payaid/ui` - UI components
- `@payaid/utils` - Utility functions
- `@payaid/oauth-client` - OAuth2 client

## Module ID

This module uses the `crm` module ID for licensing.
```

---

## 🔄 **Migration Script Template**

```typescript
// scripts/migrate-to-module.ts
/**
 * Script to migrate code from monolith to module
 * 
 * Usage: npx tsx scripts/migrate-to-module.ts
 */

import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const MODULE_ID = 'crm'
const SOURCE_DIR = process.cwd()
const TARGET_DIR = join(process.cwd(), '..', `payaid-${MODULE_ID}`)

// Files to copy
const filesToCopy = [
  'app/api/contacts',
  'app/api/deals',
  'app/dashboard/contacts',
  'app/dashboard/deals',
  // ... other module-specific files
]

// Update imports
function updateImports(content: string): string {
  // Replace @/lib/auth/jwt with @payaid/auth
  content = content.replace(
    /from ['"]@\/lib\/auth\/jwt['"]/g,
    "from '@payaid/auth'"
  )
  
  // Replace @/lib/middleware/license with @payaid/auth
  content = content.replace(
    /from ['"]@\/lib\/middleware\/license['"]/g,
    "from '@payaid/auth'"
  )
  
  // Replace @/lib/db/prisma with @payaid/db
  content = content.replace(
    /from ['"]@\/lib\/db\/prisma['"]/g,
    "from '@payaid/db'"
  )
  
  // Replace @/components/ui with @payaid/ui
  content = content.replace(
    /from ['"]@\/components\/ui\/([^'"]+)['"]/g,
    "from '@payaid/ui'"
  )
  
  return content
}

// Copy and update files
for (const filePath of filesToCopy) {
  const sourcePath = join(SOURCE_DIR, filePath)
  const targetPath = join(TARGET_DIR, filePath)
  
  // Create directory if needed
  mkdirSync(targetPath, { recursive: true })
  
  // Copy file
  const content = readFileSync(sourcePath, 'utf-8')
  const updated = updateImports(content)
  writeFileSync(targetPath, updated, 'utf-8')
}

console.log('✅ Migration complete!')
```

---

## 📋 **Module-Specific Checklists**

### **CRM Module** ⏳
- [ ] Create repository
- [ ] Copy API routes (contacts, deals, leads, etc.)
- [ ] Copy frontend pages
- [ ] Copy Prisma models
- [ ] Update imports
- [ ] Add OAuth2 middleware
- [ ] Test standalone

### **Invoicing Module** ⏳
- [ ] Create repository
- [ ] Copy API routes (invoices)
- [ ] Copy frontend pages
- [ ] Copy Prisma models
- [ ] Update imports
- [ ] Add OAuth2 middleware
- [ ] Test standalone

### **Accounting Module** ⏳
- [ ] Create repository
- [ ] Copy API routes (accounting, gst)
- [ ] Copy frontend pages
- [ ] Copy Prisma models
- [ ] Update imports
- [ ] Add OAuth2 middleware
- [ ] Test standalone

### **HR Module** ⏳
- [ ] Create repository
- [ ] Copy API routes (hr/*)
- [ ] Copy frontend pages
- [ ] Copy Prisma models
- [ ] Update imports
- [ ] Add OAuth2 middleware
- [ ] Test standalone

### **WhatsApp Module** ⏳
- [ ] Create repository
- [ ] Copy API routes (whatsapp/*)
- [ ] Copy frontend pages
- [ ] Copy Prisma models
- [ ] Update imports
- [ ] Add OAuth2 middleware
- [ ] Test standalone

### **Analytics Module** ⏳
- [ ] Create repository
- [ ] Copy API routes (analytics/*, ai/*)
- [ ] Copy frontend pages
- [ ] Copy Prisma models
- [ ] Update imports
- [ ] Add OAuth2 middleware
- [ ] Test standalone

---

**Status:** ⏳ **PENDING - Templates Ready**
