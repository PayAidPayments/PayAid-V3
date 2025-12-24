# PayAid V3 - Phase 1 Implementation Guide
**Licensing Layer & Module Gating | Ready to Code**

---

## 🚀 Quick Start: Phase 1 (2-3 weeks)

This guide walks you through implementing licensing WITHOUT breaking your current monolith.

---

## Step 1: Database Schema Updates

### 1.1 Update Prisma Schema

```prisma
// prisma/schema.prisma

model Tenant {
  id                    String    @id @default(cuid())
  name                  String
  email                 String
  
  // EXISTING FIELDS - Keep all current fields here
  
  // NEW: Module licensing
  licensedModules       String[]  @default([])  // ['crm', 'invoicing', 'whatsapp']
  subscriptionTier      String    @default("free") // 'free', 'starter', 'professional', 'enterprise'
  
  // NEW: Track subscription
  subscription          Subscription?
  
  // NEW: Module configs
  crmConfig             CRMConfig?
  invoicingConfig       InvoicingConfig?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

// NEW: Subscription tracking
model Subscription {
  id                    String    @id @default(cuid())
  tenantId              String    @unique
  tenant                Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  modules               String[]  // ['crm', 'invoicing', 'accounting']
  tier                  String    // 'starter', 'professional', 'enterprise'
  monthlyPrice          Decimal   @default(0)
  billingCycleStart     DateTime
  billingCycleEnd       DateTime
  status                String    @default("active")
  trialEndsAt           DateTime?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

// NEW: Module definitions
model ModuleDefinition {
  id                    String    @id @default(cuid())
  moduleId              String    @unique // 'crm', 'invoicing'
  displayName           String
  description           String
  icon                  String?
  
  starterPrice          Decimal
  professionalPrice     Decimal
  enterprisePrice       Decimal?
  
  features              String[]
  isActive              Boolean   @default(true)
  
  createdAt             DateTime  @default(now())
}

// CRM-specific config
model CRMConfig {
  id                    String    @id @default(cuid())
  tenantId              String    @unique
  tenant                Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  leadScoringEnabled    Boolean   @default(true)
  automationsEnabled    Boolean   @default(true)
  maxContacts           Int       @default(1000)
}

model InvoicingConfig {
  id                    String    @id @default(cuid())
  tenantId              String    @unique
  tenant                Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  maxInvoicesPerMonth   Int       @default(200)
  recurringEnabled      Boolean   @default(true)
}
```

### 1.2 Create Migration

```bash
npx prisma migrate dev --name add_licensing
```

---

## Step 2: Update JWT Token Generation

### 2.1 Auth Service

```typescript
// lib/auth/generate-token.ts

import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'

export async function generateAccessToken(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenant: {
        include: {
          subscription: true,
          crmConfig: true
        }
      }
    }
  })
  
  if (!user || !user.tenant) {
    throw new Error('User or tenant not found')
  }
  
  const payload = {
    // Standard JWT claims
    sub: user.id,
    email: user.email,
    
    // Tenant + Licensing info (NEW)
    tenantId: user.tenant.id,
    tenantName: user.tenant.name,
    licensedModules: user.tenant.licensedModules || [],
    subscriptionTier: user.tenant.subscriptionTier,
    
    // Permissions
    permissions: user.permissions || ['read', 'write'],
    
    // Token metadata
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    iss: 'payaid.io',
  }
  
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { algorithm: 'HS256' }
  )
  
  return token
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
      { algorithms: ['HS256'] }
    ) as any
    
    return {
      userId: decoded.sub,
      tenantId: decoded.tenantId,
      licensedModules: decoded.licensedModules,
      subscriptionTier: decoded.subscriptionTier,
      permissions: decoded.permissions,
      raw: decoded
    }
  } catch (error) {
    throw new Error('Invalid token')
  }
}
```

### 2.2 Update Login Route

```typescript
// app/api/auth/login/route.ts

import { generateAccessToken } from '@/lib/auth/generate-token'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true }
  })
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'User not found' }),
      { status: 404 }
    )
  }
  
  const passwordValid = await bcrypt.compare(password, user.passwordHash)
  
  if (!passwordValid) {
    return new Response(
      JSON.stringify({ error: 'Invalid password' }),
      { status: 401 }
    )
  }
  
  // GENERATE TOKEN WITH LICENSING INFO
  const token = await generateAccessToken(user.id)
  
  const response = new Response(
    JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        tenantId: user.tenant.id,
        licensedModules: user.tenant.licensedModules
      },
      token
    })
  )
  
  // Set httpOnly cookie
  response.cookies.set('payaid_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60
  })
  
  return response
}
```

---

## Step 3: License Checking Middleware

### 3.1 Create Middleware

```typescript
// lib/middleware/license.ts

import { verifyToken } from '@/lib/auth/generate-token'
import { prisma } from '@/lib/db/prisma'

export class LicenseError extends Error {
  constructor(module: string) {
    super(`Module '${module}' not licensed for this tenant`)
    this.name = 'LicenseError'
  }
}

export async function checkModuleAccess(
  request: Request,
  requiredModule: string
) {
  try {
    // Get token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies?.get('payaid_token')?.value
    
    if (!token) {
      throw new Error('No authentication token')
    }
    
    // Verify token
    const decoded = verifyToken(token)
    
    // Check if module is licensed
    if (!decoded.licensedModules.includes(requiredModule)) {
      throw new LicenseError(requiredModule)
    }
    
    // Get fresh tenant info from DB
    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.tenantId },
      include: { subscription: true }
    })
    
    if (!tenant) {
      throw new Error('Tenant not found')
    }
    
    // Check if subscription is active
    if (tenant.subscription?.status !== 'active' && 
        tenant.subscription?.status !== 'trial') {
      throw new Error('Subscription not active')
    }
    
    return {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      licensedModules: decoded.licensedModules,
      subscriptionTier: decoded.subscriptionTier,
      permissions: decoded.permissions,
      tenant
    }
  } catch (error) {
    if (error instanceof LicenseError) {
      throw error
    }
    throw new Error(`Authentication failed: ${error.message}`)
  }
}
```

---

## Step 4: Update All API Routes

### 4.1 Example: GET Contacts (CRM Module)

```typescript
// app/api/contacts/route.ts

import { checkModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: Request) {
  try {
    // CHECK MODULE ACCESS - This is the only addition
    const { tenantId } = await checkModuleAccess(request, 'crm')
    
    const contacts = await prisma.contact.findMany({
      where: { tenantId },
      include: {
        interactions: true,
        deals: true
      }
    })
    
    return Response.json({
      success: true,
      data: contacts
    })
  } catch (error) {
    if (error.name === 'LicenseError') {
      return Response.json(
        { error: error.message },
        { status: 403 }
      )
    }
    
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId } = await checkModuleAccess(request, 'crm')
    
    const body = await request.json()
    
    const contact = await prisma.contact.create({
      data: {
        ...body,
        tenantId
      }
    })
    
    return Response.json({
      success: true,
      data: contact
    }, { status: 201 })
  } catch (error) {
    if (error.name === 'LicenseError') {
      return Response.json(
        { error: error.message },
        { status: 403 }
      )
    }
    
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

### 4.2 Module Pattern (Copy for all routes)

```typescript
// app/api/[module]/[resource]/route.ts

import { checkModuleAccess } from '@/lib/middleware/license'

const MODULE_NAME = 'crm' // Change per module

export async function GET(request: Request) {
  const { tenantId } = await checkModuleAccess(request, MODULE_NAME)
  // ... rest of your code
}

export async function POST(request: Request) {
  const { tenantId } = await checkModuleAccess(request, MODULE_NAME)
  // ... rest of your code
}
```

---

## Step 5: Frontend - Module Gating

### 5.1 Update Sidebar

```typescript
// components/Sidebar.tsx

import { usePayAidAuth } from '@/hooks/usePayAidAuth'
import Link from 'next/link'

const ALL_MODULES = [
  { id: 'crm', name: 'CRM', icon: '👥', href: '/dashboard/contacts' },
  { id: 'invoicing', name: 'Invoicing', icon: '📄', href: '/dashboard/invoices' },
  { id: 'accounting', name: 'Accounting', icon: '📊', href: '/dashboard/accounting' },
  { id: 'hr', name: 'HR', icon: '👔', href: '/dashboard/hr' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', href: '/dashboard/whatsapp' },
  { id: 'analytics', name: 'Analytics', icon: '📈', href: '/dashboard/analytics' }
]

export function Sidebar() {
  const { licensedModules, tenant } = usePayAidAuth()
  
  return (
    <nav className="sidebar bg-white border-r">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg">PayAid</h2>
        <p className="text-sm text-gray-500">
          {tenant.subscriptionTier === 'free' 
            ? 'Free Plan' 
            : `${tenant.subscriptionTier} Plan`}
        </p>
      </div>
      
      <div className="p-4 space-y-2">
        {ALL_MODULES.map(module => {
          const isLicensed = licensedModules.includes(module.id)
          
          return isLicensed ? (
            <Link
              key={module.id}
              href={module.href}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50"
            >
              <span className="text-xl">{module.icon}</span>
              <div className="font-medium">{module.name}</div>
            </Link>
          ) : (
            <div
              key={module.id}
              className="flex items-center gap-3 p-3 rounded-lg opacity-50"
            >
              <span className="text-xl">{module.icon}</span>
              <div className="flex-1 font-medium">{module.name}</div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Locked
              </span>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
```

### 5.2 Custom Hook for Auth

```typescript
// hooks/usePayAidAuth.ts

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function usePayAidAuth() {
  const [auth, setAuth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    const token = localStorage.getItem('payaid_token')
    
    if (!token) {
      router.push('/login')
      return
    }
    
    try {
      const parts = token.split('.')
      const decoded = JSON.parse(atob(parts[1]))
      
      setAuth({
        userId: decoded.sub,
        tenantId: decoded.tenantId,
        licensedModules: decoded.licensedModules,
        subscriptionTier: decoded.subscriptionTier,
        tenant: {
          id: decoded.tenantId,
          subscriptionTier: decoded.subscriptionTier
        }
      })
    } catch (error) {
      console.error('Failed to parse token:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])
  
  const hasModule = (module: string) => {
    return auth?.licensedModules?.includes(module) || false
  }
  
  const logout = () => {
    localStorage.removeItem('payaid_token')
    document.cookie = 'payaid_token=; max-age=0'
    router.push('/login')
  }
  
  return {
    auth,
    loading,
    userId: auth?.userId,
    tenantId: auth?.tenantId,
    licensedModules: auth?.licensedModules || [],
    subscriptionTier: auth?.subscriptionTier,
    tenant: auth?.tenant,
    hasModule,
    logout
  }
}
```

### 5.3 Module Gate Component

```typescript
// components/ModuleGate.tsx

import { usePayAidAuth } from '@/hooks/usePayAidAuth'
import Link from 'next/link'

export function ModuleGate({
  module,
  children,
  fallback
}: {
  module: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { hasModule, loading } = usePayAidAuth()
  
  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }
  
  if (!hasModule(module)) {
    return fallback || <UpgradePrompt module={module} />
  }
  
  return <>{children}</>
}

function UpgradePrompt({ module }: { module: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-12 max-w-md text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-2">Module Locked</h1>
        <p className="text-gray-600 mb-6">
          This feature is not available on your current plan.
          Upgrade to unlock it.
        </p>
        <Link
          href="/upgrade"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          View Plans & Upgrade
        </Link>
      </div>
    </div>
  )
}
```

---

## Step 6: Database Seeding

```typescript
// prisma/seed.ts

import { prisma } from '@/lib/db/prisma'

async function main() {
  await prisma.moduleDefinition.deleteMany({})
  
  const modules = [
    {
      moduleId: 'crm',
      displayName: 'CRM',
      description: 'Manage contacts, deals, and sales pipeline',
      icon: '👥',
      starterPrice: 1999,
      professionalPrice: 4999,
      enterprisePrice: null,
      features: ['contact_management', 'deal_pipeline', 'lead_scoring']
    },
    {
      moduleId: 'invoicing',
      displayName: 'Invoicing & Billing',
      description: 'Create, send, and track invoices',
      icon: '📄',
      starterPrice: 999,
      professionalPrice: 2499,
      enterprisePrice: null,
      features: ['invoice_creation', 'gst_compliance', 'payment_links']
    },
    // ... other modules
  ]
  
  for (const module of modules) {
    await prisma.moduleDefinition.create({ data: module })
  }
  
  console.log('✅ Module definitions seeded')
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
```

Run: `npx prisma db seed`

---

## Step 7: Testing Checklist

- [ ] Database: Verify new tables created
- [ ] Auth: JWT token includes licensedModules
- [ ] API: Calling unlicensed module returns 403
- [ ] Frontend: Sidebar shows only licensed modules
- [ ] ModuleGate: Blocks access to unlicensed modules
- [ ] Upgrade flow: Prompts user to upgrade

---

## ✅ You're Done with Phase 1!

After these steps:
- ✅ Monolith still works perfectly
- ✅ Each module is now licensable
- ✅ You can offer à la carte pricing
- ✅ Foundation for Phase 2 is set

**Next:** Test with 10 customers, gather feedback, then move to Phase 2 (module separation)