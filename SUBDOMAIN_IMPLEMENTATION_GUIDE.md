# Subdomain Implementation Guide

**Date:** January 2025  
**Status:** 📋 **IMPLEMENTATION GUIDE**  
**Architecture:** ✅ **Decoupled Architecture** (No Monolithic References)

---

## 🎯 Goal

Implement custom subdomain URLs for modules in **decoupled architecture**:
- `crm.demobusiness.payaid.com` → CRM module for Demo Business
- `marketing.demobusiness.payaid.com` → Marketing module for Demo Business

**Note:** This guide assumes decoupled architecture where:
- Each module is accessed directly (no sidebar)
- Users go to module-specific pages: `/crm/[tenantId]/Home/`, `/marketing/[tenantId]/Home/`
- Each module has its own top bar with module-specific navigation
- Module switcher (dropdown in top bar) for cross-module navigation

---

## 📋 Implementation Steps

### **Step 1: Database Schema**

Add `ModuleSubdomain` model to Prisma schema:

```prisma
model ModuleSubdomain {
  id          String   @id @default(cuid())
  tenantId    String
  moduleId    String   // 'crm', 'marketing', 'finance', etc.
  subdomain   String   // Full subdomain: 'crm.demobusiness.payaid.com'
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@unique([tenantId, moduleId])
  @@index([subdomain])
  @@index([tenantId])
}
```

**Update Tenant model:**
```prisma
model Tenant {
  // ... existing fields
  moduleSubdomains ModuleSubdomain[]
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_module_subdomain
```

---

### **Step 2: Subdomain Parsing Utility**

Create `lib/utils/subdomain-parser.ts`:

```typescript
export interface ParsedSubdomain {
  module: string | null
  org: string | null
  isModuleSubdomain: boolean
  isOrgSubdomain: boolean
}

/**
 * Parse subdomain from hostname
 * 
 * Examples:
 * - crm.demobusiness.payaid.com → { module: 'crm', org: 'demobusiness', isModuleSubdomain: true }
 * - marketing.payaid.com → { module: 'marketing', org: null, isModuleSubdomain: true }
 * - demobusiness.payaid.com → { module: null, org: 'demobusiness', isModuleSubdomain: false }
 * - payaid.com → { module: null, org: null, isModuleSubdomain: false }
 */
export function parseSubdomain(hostname: string): ParsedSubdomain {
  // Remove port if present
  const host = hostname.split(':')[0]
  
  // Get base domain from env or default
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'payaid.com'
  
  // Check if hostname ends with base domain
  if (!host.endsWith(`.${baseDomain}`) && host !== baseDomain) {
    return {
      module: null,
      org: null,
      isModuleSubdomain: false,
      isOrgSubdomain: false,
    }
  }
  
  // Remove base domain
  const subdomainPart = host.replace(`.${baseDomain}`, '')
  
  if (!subdomainPart) {
    return {
      module: null,
      org: null,
      isModuleSubdomain: false,
      isOrgSubdomain: false,
    }
  }
  
  // Split by dots
  const parts = subdomainPart.split('.')
  
  // Known module IDs
  const moduleIds = ['crm', 'marketing', 'finance', 'hr', 'sales', 'projects', 'inventory', 'analytics', 'communication', 'ai-studio', 'productivity']
  
  // Check if first part is a module
  if (parts.length === 1) {
    // Single subdomain: crm.payaid.com or demobusiness.payaid.com
    if (moduleIds.includes(parts[0])) {
      return {
        module: parts[0],
        org: null,
        isModuleSubdomain: true,
        isOrgSubdomain: false,
      }
    } else {
      // Organization subdomain
      return {
        module: null,
        org: parts[0],
        isModuleSubdomain: false,
        isOrgSubdomain: true,
      }
    }
  } else if (parts.length === 2) {
    // Two parts: crm.demobusiness.payaid.com
    const [first, second] = parts
    
    if (moduleIds.includes(first)) {
      // Module.org format
      return {
        module: first,
        org: second,
        isModuleSubdomain: true,
        isOrgSubdomain: true,
      }
    } else {
      // Unknown format, treat as org
      return {
        module: null,
        org: first,
        isModuleSubdomain: false,
        isOrgSubdomain: true,
      }
    }
  }
  
  // Unknown format
  return {
    module: null,
    org: null,
    isModuleSubdomain: false,
    isOrgSubdomain: false,
  }
}
```

---

### **Step 3: Middleware Update**

Update `middleware.ts` to handle subdomains:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { parseSubdomain } from '@/lib/utils/subdomain-parser'
import { getTenantBySubdomain } from '@/lib/middleware/tenant'
import { prisma } from '@/lib/db/prisma'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname
  
  // Parse subdomain
  const parsed = parseSubdomain(hostname)
  
  // Handle module subdomain (crm.demobusiness.payaid.com)
  if (parsed.isModuleSubdomain && parsed.module && parsed.org) {
    // Find tenant by org subdomain
    const tenant = await getTenantBySubdomain(parsed.org)
    
    if (!tenant) {
      return NextResponse.redirect(new URL('/not-found', request.url))
    }
    
    // Check if module subdomain exists and is active
    const moduleSubdomain = await prisma.moduleSubdomain.findUnique({
      where: {
        tenantId_moduleId: {
          tenantId: tenant.id,
          moduleId: parsed.module,
        },
      },
    })
    
    if (!moduleSubdomain || !moduleSubdomain.isActive) {
      return NextResponse.redirect(new URL('/module-not-available', request.url))
    }
    
    // Check if module is licensed
    if (!tenant.licensedModules.includes(parsed.module)) {
      return NextResponse.redirect(new URL('/module-not-licensed', request.url))
    }
    
    // Rewrite URL to module path
    const modulePath = `/${parsed.module}${pathname}`
    const url = request.nextUrl.clone()
    url.pathname = modulePath
    
    // Add tenant ID to headers for downstream use
    const response = NextResponse.rewrite(url)
    response.headers.set('x-tenant-id', tenant.id)
    response.headers.set('x-module-id', parsed.module)
    
    return response
  }
  
  // Handle single module subdomain (crm.payaid.com) - global module
  if (parsed.isModuleSubdomain && parsed.module && !parsed.org) {
    // Rewrite to module path
    const modulePath = `/${parsed.module}${pathname}`
    const url = request.nextUrl.clone()
    url.pathname = modulePath
    
    return NextResponse.rewrite(url)
  }
  
  // Continue with normal routing
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

### **Step 4: API Routes for Module Subdomain Management**

Create `app/api/admin/module-subdomains/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { z } from 'zod'

const createSubdomainSchema = z.object({
  moduleId: z.string(),
  subdomain: z.string().regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
})

/**
 * GET /api/admin/module-subdomains
 * Get all module subdomains for current tenant
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from token
    const token = request.cookies.get('authToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const payload = verifyToken(token)
    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Get all module subdomains for tenant
    const subdomains = await prisma.moduleSubdomain.findMany({
      where: {
        tenantId: payload.tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json({ subdomains })
  } catch (error) {
    console.error('Error fetching module subdomains:', error)
    return NextResponse.json(
      { error: 'Failed to fetch module subdomains' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/module-subdomains
 * Create a new module subdomain
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from token
    const token = request.cookies.get('authToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const payload = verifyToken(token)
    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Check if user is admin
    if (payload.role !== 'admin' && payload.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const validated = createSubdomainSchema.parse(body)
    
    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
    })
    
    if (!tenant || !tenant.subdomain) {
      return NextResponse.json(
        { error: 'Tenant subdomain not found' },
        { status: 400 }
      )
    }
    
    // Check if module is licensed
    if (!tenant.licensedModules.includes(validated.moduleId)) {
      return NextResponse.json(
        { error: 'Module is not licensed' },
        { status: 400 }
      )
    }
    
    // Build full subdomain
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'payaid.com'
    const fullSubdomain = `${validated.moduleId}.${tenant.subdomain}.${baseDomain}`
    
    // Check if subdomain already exists
    const existing = await prisma.moduleSubdomain.findUnique({
      where: {
        tenantId_moduleId: {
          tenantId: payload.tenantId,
          moduleId: validated.moduleId,
        },
      },
    })
    
    if (existing) {
      // Update existing
      const updated = await prisma.moduleSubdomain.update({
        where: { id: existing.id },
        data: {
          subdomain: fullSubdomain,
          isActive: true,
        },
      })
      
      return NextResponse.json({ subdomain: updated })
    }
    
    // Create new
    const subdomain = await prisma.moduleSubdomain.create({
      data: {
        tenantId: payload.tenantId,
        moduleId: validated.moduleId,
        subdomain: fullSubdomain,
        isActive: true,
      },
    })
    
    return NextResponse.json({ subdomain }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating module subdomain:', error)
    return NextResponse.json(
      { error: 'Failed to create module subdomain' },
      { status: 500 }
    )
  }
}
```

Create `app/api/admin/module-subdomains/[id]/route.ts` for update/delete:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * PATCH /api/admin/module-subdomains/[id]
 * Update module subdomain (activate/deactivate)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get('authToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const payload = verifyToken(token)
    if (payload.role !== 'admin' && payload.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { isActive } = body
    
    const subdomain = await prisma.moduleSubdomain.update({
      where: { id },
      data: { isActive },
    })
    
    return NextResponse.json({ subdomain })
  } catch (error) {
    console.error('Error updating module subdomain:', error)
    return NextResponse.json(
      { error: 'Failed to update module subdomain' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/module-subdomains/[id]
 * Delete module subdomain
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get('authToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const payload = verifyToken(token)
    if (payload.role !== 'admin' && payload.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    await prisma.moduleSubdomain.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting module subdomain:', error)
    return NextResponse.json(
      { error: 'Failed to delete module subdomain' },
      { status: 500 }
    )
  }
}
```

---

### **Step 5: Admin UI Component**

Create `app/settings/admin/module-subdomains/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth'

interface ModuleSubdomain {
  id: string
  moduleId: string
  subdomain: string
  isActive: boolean
  createdAt: string
}

export default function ModuleSubdomainsPage() {
  const { tenant } = useAuthStore()
  const [subdomains, setSubdomains] = useState<ModuleSubdomain[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedModule, setSelectedModule] = useState('')
  
  const modules = tenant?.licensedModules || []
  
  useEffect(() => {
    fetchSubdomains()
  }, [])
  
  async function fetchSubdomains() {
    try {
      const res = await fetch('/api/admin/module-subdomains')
      const data = await res.json()
      setSubdomains(data.subdomains || [])
    } catch (error) {
      console.error('Error fetching subdomains:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function createSubdomain() {
    if (!selectedModule) return
    
    try {
      const res = await fetch('/api/admin/module-subdomains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: selectedModule }),
      })
      
      if (res.ok) {
        await fetchSubdomains()
        setSelectedModule('')
      }
    } catch (error) {
      console.error('Error creating subdomain:', error)
    }
  }
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Module Subdomains</h1>
      
      {/* Create New Subdomain */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-4">Create Custom URL</h2>
        <div className="flex gap-4">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Select Module</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module.charAt(0).toUpperCase() + module.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={createSubdomain}
            disabled={!selectedModule}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Create URL
          </button>
        </div>
      </div>
      
      {/* List Subdomains */}
      <div className="space-y-4">
        {subdomains.map((subdomain) => (
          <div key={subdomain.id} className="p-4 border rounded">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{subdomain.moduleId.toUpperCase()}</h3>
                <p className="text-sm text-gray-600">{subdomain.subdomain}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://${subdomain.subdomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                >
                  Open
                </a>
                <button
                  onClick={() => toggleSubdomain(subdomain.id, !subdomain.isActive)}
                  className={`px-3 py-1 rounded text-sm ${
                    subdomain.isActive
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-600 text-white'
                  }`}
                >
                  {subdomain.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### **Step 6: DNS Configuration**

**For Production:**

1. **Wildcard DNS Record:**
   ```
   Type: A (or CNAME)
   Name: *.payaid.com
   Value: [Your Server IP or Load Balancer]
   ```

2. **SSL Certificate:**
   - Use Let's Encrypt with wildcard certificate
   - Or use Cloudflare/other CDN with SSL

**For Development:**

1. **Edit hosts file:**
   ```
   Windows: C:\Windows\System32\drivers\etc\hosts
   Mac/Linux: /etc/hosts
   
   Add:
   127.0.0.1 crm.demobusiness.localhost
   127.0.0.1 marketing.demobusiness.localhost
   ```

2. **Update .env:**
   ```
   NEXT_PUBLIC_BASE_DOMAIN=localhost
   ```

---

### **Step 7: Cookie Domain Configuration**

Update login route to set cookie with proper domain:

```typescript
// app/api/auth/login/route.ts

// Set cookie with domain for subdomain support
const cookieDomain = process.env.NODE_ENV === 'production' 
  ? '.payaid.com'  // Works across all subdomains
  : 'localhost'    // Local development

response.cookies.set('authToken', token, {
  domain: cookieDomain,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
})
```

---

## ✅ Testing Checklist

- [ ] Create module subdomain via admin UI
- [ ] Access module via custom subdomain
- [ ] SSO works across subdomains (login once, access all)
- [ ] Module access control works (only assigned modules visible)
- [ ] Inactive subdomain redirects properly
- [ ] Unlicensed module subdomain shows error
- [ ] Cookie works across subdomains
- [ ] DNS configuration works (production)

---

## 🚀 Deployment Steps

1. **Database Migration:**
   ```bash
   npx prisma migrate deploy
   ```

2. **Environment Variables:**
   ```
   NEXT_PUBLIC_BASE_DOMAIN=payaid.com
   ```

3. **DNS Setup:**
   - Configure wildcard DNS
   - Setup SSL certificates

4. **Test:**
   - Create test subdomain
   - Verify routing works
   - Test SSO across subdomains

---

**Last Updated:** January 2025  
**Status:** Ready for implementation

