# 🔐 Phase 2: OAuth2 SSO Implementation

**Date:** December 2025  
**Status:** ⏳ **PENDING**  
**Purpose:** Implement OAuth2 Single Sign-On for cross-module authentication

---

## 🎯 **OAuth2 SSO Architecture**

### **Flow Diagram:**

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Navigate to crm.payaid.io
       ▼
┌─────────────────────┐
│  CRM Module         │
│  (crm.payaid.io)    │
└──────┬──────────────┘
       │
       │ 2. No token found
       │ 3. Redirect to core
       ▼
┌─────────────────────┐
│  Core Module        │
│  (payaid.io)        │
│  /api/oauth/authorize│
└──────┬──────────────┘
       │
       │ 4. User logs in
       │ 5. Generate auth code
       │ 6. Redirect back with code
       ▼
┌─────────────────────┐
│  CRM Module         │
│  /api/oauth/callback│
└──────┬──────────────┘
       │
       │ 7. Exchange code for token
       │ 8. Store token in cookie
       │ 9. User authenticated
       ▼
┌─────────────────────┐
│  CRM Module         │
│  (User can access)  │
└─────────────────────┘
```

---

## 📦 **OAuth2 Client Package** ✅

**Location:** `packages/@payaid/oauth-client/`

**Created:**
- ✅ `package.json`
- ✅ `src/index.ts` - OAuth2 client utilities
- ✅ `tsconfig.json`

**Functions:**
- `redirectToAuth()` - Redirect to core for authentication
- `exchangeCodeForToken()` - Exchange code for JWT token
- `getTokenFromRequest()` - Get token from request
- `verifyRequestToken()` - Verify token
- `setTokenCookie()` - Set token in cookie
- `clearTokenCookie()` - Clear token cookie

---

## 🔧 **Core Module - OAuth2 Provider**

### **1. Authorization Endpoint** ⏳

**Create:** `app/api/oauth/authorize/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { signToken } from '@payaid/auth'
import { cache } from '@/lib/redis/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const clientId = searchParams.get('client_id')
  const redirectUri = searchParams.get('redirect_uri')
  const responseType = searchParams.get('response_type')
  const state = searchParams.get('state')
  
  // Validate client_id
  if (clientId !== process.env.OAUTH_CLIENT_ID) {
    return NextResponse.json({ error: 'Invalid client_id' }, { status: 400 })
  }
  
  // Check if user is already logged in (check cookie)
  const token = request.cookies.get('payaid_token')?.value
  if (!token) {
    // Redirect to login page with return URL
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // Verify token and get user
  try {
    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { tenant: true },
    })
    
    if (!user) {
      throw new Error('User not found')
    }
    
    // Generate authorization code
    const authCode = crypto.randomBytes(32).toString('hex')
    
    // Store code in Redis (5 minute expiry)
    await cache.set(
      `oauth:code:${authCode}`,
      JSON.stringify({
        userId: user.id,
        tenantId: user.tenantId,
        redirectUri,
        clientId,
      }),
      300 // 5 minutes
    )
    
    // Redirect back to module with code
    const redirectUrl = new URL(redirectUri)
    redirectUrl.searchParams.set('code', authCode)
    if (state) {
      redirectUrl.searchParams.set('state', state)
    }
    
    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.url)
    return NextResponse.redirect(loginUrl)
  }
}
```

---

### **2. Token Endpoint** ⏳

**Create:** `app/api/oauth/token/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { signToken } from '@payaid/auth'
import { cache } from '@/lib/redis/client'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { grant_type, code, redirect_uri, client_id, client_secret } = body
  
  // Validate grant type
  if (grant_type !== 'authorization_code') {
    return NextResponse.json(
      { error: 'unsupported_grant_type' },
      { status: 400 }
    )
  }
  
  // Validate client credentials
  if (client_id !== process.env.OAUTH_CLIENT_ID ||
      client_secret !== process.env.OAUTH_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'invalid_client' },
      { status: 401 }
    )
  }
  
  // Get authorization code from Redis
  const codeData = await cache.get(`oauth:code:${code}`)
  if (!codeData) {
    return NextResponse.json(
      { error: 'invalid_grant' },
      { status: 400 }
    )
  }
  
  const { userId, tenantId, redirectUri } = JSON.parse(codeData)
  
  // Validate redirect_uri matches
  if (redirect_uri !== redirectUri) {
    return NextResponse.json(
      { error: 'invalid_grant' },
      { status: 400 }
    )
  }
  
  // Delete code (one-time use)
  await cache.del(`oauth:code:${code}`)
  
  // Get user and tenant
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: true },
  })
  
  if (!user) {
    return NextResponse.json(
      { error: 'invalid_grant' },
      { status: 400 }
    )
  }
  
  // Generate JWT token
  const token = signToken({
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
    licensedModules: user.tenant.licensedModules,
    subscriptionTier: user.tenant.subscriptionTier,
  })
  
  // Return token
  return NextResponse.json({
    access_token: token,
    token_type: 'Bearer',
    expires_in: 86400, // 24 hours
  })
}
```

---

### **3. UserInfo Endpoint** ⏳

**Create:** `app/api/oauth/userinfo/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@payaid/auth'
import { prisma } from '@payaid/db'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json(
      { error: 'unauthorized' },
      { status: 401 }
    )
  }
  
  try {
    const payload = verifyToken(token)
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { tenant: true },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'user_not_found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenant_id: user.tenantId,
      tenant_name: user.tenant.name,
      licensed_modules: user.tenant.licensedModules,
      subscription_tier: user.tenant.subscriptionTier,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'invalid_token' },
      { status: 401 }
    )
  }
}
```

---

## 🔧 **Module - OAuth2 Client**

### **1. Middleware** ⏳

**Create:** `middleware.ts` (in each module)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyRequestToken, redirectToAuth } from '@payaid/oauth-client'

export async function middleware(request: NextRequest) {
  // Skip auth for public routes
  if (request.nextUrl.pathname.startsWith('/api/oauth/callback')) {
    return NextResponse.next()
  }
  
  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next()
  }
  
  // Check for token
  const payload = verifyRequestToken(request)
  
  if (!payload) {
    // No token - redirect to core for auth
    const returnUrl = request.url
    return redirectToAuth(returnUrl)
  }
  
  // Token valid - allow request
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

### **2. OAuth Callback** ⏳

**Create:** `app/api/oauth/callback/route.ts` (in each module)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, setTokenCookie } from '@payaid/oauth-client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  if (error) {
    return NextResponse.redirect('/login?error=' + error)
  }
  
  if (!code) {
    return NextResponse.redirect('/login?error=no_code')
  }
  
  try {
    // Exchange code for token
    const redirectUri = new URL('/api/oauth/callback', request.url).toString()
    const token = await exchangeCodeForToken(code, redirectUri)
    
    // Create response
    const response = NextResponse.redirect('/dashboard')
    
    // Set token in cookie
    setTokenCookie(response, token)
    
    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect('/login?error=token_exchange_failed')
  }
}
```

---

## 📋 **Implementation Checklist**

### **Core Module** ⏳
- [ ] Create `/api/oauth/authorize` endpoint
- [ ] Create `/api/oauth/token` endpoint
- [ ] Create `/api/oauth/userinfo` endpoint
- [ ] Test authorization flow
- [ ] Test token exchange
- [ ] Test userinfo endpoint

### **Module (CRM Example)** ⏳
- [ ] Create `middleware.ts` with OAuth2 client
- [ ] Create `/api/oauth/callback` endpoint
- [ ] Update API routes to use token from cookie
- [ ] Test authentication flow
- [ ] Test token refresh

### **All Modules** ⏳
- [ ] Implement middleware in each module
- [ ] Implement callback in each module
- [ ] Test cross-module navigation
- [ ] Test token persistence
- [ ] Test logout flow

---

## 🔒 **Security Considerations**

1. **HTTPS Only:** All OAuth2 flows must use HTTPS in production
2. **State Parameter:** Use state parameter to prevent CSRF attacks
3. **Code Expiry:** Authorization codes expire in 5 minutes
4. **One-Time Use:** Codes are deleted after use
5. **Token Storage:** Tokens stored in httpOnly cookies
6. **Shared Domain:** Use `.payaid.io` domain for cookies

---

## 🧪 **Testing**

### **Test Scenarios:**

1. **Happy Path:**
   - User navigates to module
   - Redirected to core for login
   - Logs in successfully
   - Redirected back with code
   - Token exchanged
   - User can access module

2. **Already Authenticated:**
   - User has valid token in cookie
   - Navigates to new module
   - Token reused (no redirect)

3. **Token Expired:**
   - User has expired token
   - Redirected to core for re-auth
   - New token issued

4. **Invalid Code:**
   - Code expired or already used
   - Error returned
   - User redirected to login

---

**Status:** ⏳ **PENDING - Ready to Implement**
