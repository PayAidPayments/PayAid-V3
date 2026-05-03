# OAuth2 Single Sign-On (SSO) Documentation

**Version:** 1.0  
**Date:** Week 7  
**Status:** ✅ **Complete**

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [OAuth2 Flow](#oauth2-flow)
4. [Implementation](#implementation)
5. [Usage Guide](#usage-guide)
6. [API Reference](#api-reference)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 **Overview**

PayAid uses OAuth2 Single Sign-On (SSO) to enable seamless authentication across multiple modules. Users authenticate once at the core module and can access all licensed modules without re-authenticating.

### **Key Features:**
- ✅ Single Sign-On across all modules
- ✅ Centralized authentication at core module
- ✅ Automatic token refresh
- ✅ Secure token storage (HTTP-only cookies)
- ✅ Module-specific license checking
- ✅ Cross-domain cookie support

---

## 🏗️ **Architecture**

### **Components:**

1. **Core Module** (`payaid.io`)
   - OAuth2 Provider
   - Authorization endpoint (`/api/oauth/authorize`)
   - Token endpoint (`/api/oauth/token`)
   - UserInfo endpoint (`/api/oauth/userinfo`)

2. **Module Clients** (`crm.payaid.io`, `invoicing.payaid.io`, etc.)
   - OAuth2 Clients
   - Callback endpoints (`/api/oauth/callback`)
   - Logout endpoints (`/api/auth/logout`)
   - Authentication middleware

3. **Shared Package** (`@payaid/oauth-client`)
   - OAuth2 client utilities
   - Token management
   - Middleware helpers
   - Refresh token support

---

## 🔄 **OAuth2 Flow**

### **Authorization Code Flow:**

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Navigate to crm.payaid.io
     ▼
┌─────────────────────┐
│  CRM Module         │
│  (No token found)   │
└────┬────────────────┘
     │
     │ 2. Redirect to core
     │    /api/oauth/authorize
     ▼
┌─────────────────────┐
│  Core Module        │
│  /api/oauth/authorize│
└────┬────────────────┘
     │
     │ 3. User logs in
     │ 4. Generate auth code
     │ 5. Redirect with code
     ▼
┌─────────────────────┐
│  CRM Module         │
│  /api/oauth/callback│
└────┬────────────────┘
     │
     │ 6. Exchange code for token
     │ 7. Store token in cookie
     │ 8. User authenticated
     ▼
┌─────────────────────┐
│  CRM Module         │
│  (User can access)  │
└─────────────────────┘
```

---

## 🔧 **Implementation**

### **1. OAuth2 Provider (Core Module)**

#### **Authorization Endpoint** (`/api/oauth/authorize`)

**Method:** GET

**Query Parameters:**
- `client_id` - OAuth2 client ID
- `redirect_uri` - Callback URL
- `response_type` - Must be "code"
- `state` - Optional state parameter
- `scope` - Optional scope (default: "openid profile email")

**Response:** Redirects to `redirect_uri` with authorization code

**Example:**
```
GET /api/oauth/authorize?client_id=xxx&redirect_uri=https://crm.payaid.io/api/oauth/callback&response_type=code
```

#### **Token Endpoint** (`/api/oauth/token`)

**Method:** POST

**Body (Authorization Code Grant):**
```json
{
  "grant_type": "authorization_code",
  "code": "authorization_code",
  "redirect_uri": "callback_url",
  "client_id": "client_id",
  "client_secret": "client_secret"
}
```

**Body (Refresh Token Grant):**
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "refresh_token",
  "client_id": "client_id",
  "client_secret": "client_secret"
}
```

**Response:**
```json
{
  "access_token": "jwt_token",
  "token_type": "Bearer",
  "expires_in": 86400,
  "refresh_token": "refresh_token",
  "scope": "openid profile email"
}
```

#### **UserInfo Endpoint** (`/api/oauth/userinfo`)

**Method:** GET

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "email_verified": true,
  "role": "admin",
  "tenant_id": "tenant_id",
  "tenant_name": "Tenant Name",
  "licensed_modules": ["crm", "invoicing"],
  "subscription_tier": "pro"
}
```

---

### **2. OAuth2 Client (Modules)**

#### **Callback Endpoint** (`/api/oauth/callback`)

**Method:** GET

**Query Parameters:**
- `code` - Authorization code
- `state` - Optional state parameter
- `error` - Error code (if error occurred)

**Response:** Redirects to home page with token set in cookie

#### **Logout Endpoint** (`/api/auth/logout`)

**Method:** GET or POST

**Response:** Clears token cookies and redirects to core logout

---

### **3. Authentication Middleware**

Each module has authentication middleware helpers:

```typescript
import { requireCRMAuth, requireCRMAccess } from '@/lib/middleware/auth'

// In route handler
export async function GET(request: NextRequest) {
  // Require authentication
  const auth = requireCRMAuth(request)
  if (!auth.authenticated) {
    return auth.response // Redirect to login
  }
  
  // Require CRM module access
  const access = requireCRMAccess(request)
  if (!access.authenticated) {
    return access.response // 403 error
  }
  
  // Use auth.payload for user info
  const { tenantId, userId } = auth.payload
  
  // ... rest of handler
}
```

---

## 📚 **Usage Guide**

### **For Module Developers:**

#### **1. Add Authentication to Route**

```typescript
import { requireCRMAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireCRMAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }
  
  const { tenantId, userId } = auth.payload
  // ... handler logic
}
```

#### **2. Check Module License**

```typescript
import { requireCRMAccess } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const access = requireCRMAccess(request)
  if (!access.authenticated) {
    return access.response
  }
  
  // User has CRM module access
  // ... handler logic
}
```

#### **3. Optional Authentication**

```typescript
import { optionalCRMAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = optionalCRMAuth(request)
  
  if (auth.authenticated) {
    // User is authenticated
    const { tenantId, userId } = auth.payload
  } else {
    // User is not authenticated (no redirect)
  }
  
  // ... handler logic
}
```

---

## 🔌 **API Reference**

### **@payaid/oauth-client Package**

#### **Functions:**

**`redirectToAuth(returnUrl: string): NextResponse`**
- Redirects user to core for authentication
- Parameters: `returnUrl` - URL to return to after auth

**`exchangeCodeForToken(code: string, redirectUri: string): Promise<string>`**
- Exchanges authorization code for access token
- Returns: Access token string

**`exchangeCodeForTokens(code: string, redirectUri: string): Promise<{access_token: string, refresh_token?: string}>`**
- Exchanges authorization code for both tokens
- Returns: Object with access_token and optional refresh_token

**`getTokenFromRequest(request: NextRequest): string | null`**
- Gets token from request (cookie or Authorization header)
- Returns: Token string or null

**`verifyRequestToken(request: NextRequest): JWTPayload | null`**
- Verifies token and returns payload
- Returns: JWT payload or null

**`setTokenCookie(response: NextResponse, token: string): void`**
- Sets access token in response cookie

**`setRefreshTokenCookie(response: NextResponse, refreshToken: string): void`**
- Sets refresh token in response cookie

**`clearTokenCookie(response: NextResponse): void`**
- Clears both access and refresh token cookies

**`requireAuth(request: NextRequest, returnUrl?: string): AuthMiddlewareResult`**
- Requires authentication, redirects if not authenticated

**`optionalAuth(request: NextRequest): AuthMiddlewareResult`**
- Optional authentication, returns status without redirecting

**`shouldRefreshToken(token: string): boolean`**
- Checks if token needs refresh (within 1 hour of expiry)

**`refreshAccessToken(refreshToken: string): Promise<TokenResponse>`**
- Refreshes access token using refresh token

**`autoRefreshToken(request: NextRequest): Promise<{token: string, refreshed: boolean}>`**
- Automatically refreshes token if needed

---

## 🧪 **Testing**

### **Manual Testing:**

1. **Test Authorization Flow:**
   - Navigate to `https://crm.payaid.io`
   - Should redirect to core login
   - Login with credentials
   - Should redirect back to CRM module
   - Should be authenticated

2. **Test Token Refresh:**
   - Wait for token to expire (or manually expire)
   - Make API request
   - Token should auto-refresh

3. **Test Logout:**
   - Click logout
   - Token cookies should be cleared
   - Should redirect to core logout

4. **Test Cross-Module Navigation:**
   - Login to CRM module
   - Navigate to Invoicing module
   - Should be automatically authenticated

### **Automated Testing:**

```typescript
// Example test
describe('OAuth2 Flow', () => {
  it('should redirect to core for authentication', async () => {
    const response = await fetch('https://crm.payaid.io/api/contacts')
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('payaid.io/api/oauth/authorize')
  })
  
  it('should exchange code for token', async () => {
    const response = await fetch('https://crm.payaid.io/api/oauth/callback?code=test_code')
    expect(response.status).toBe(302)
    expect(response.headers.get('set-cookie')).toContain('payaid_token')
  })
})
```

---

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **Token Not Found:**
   - Check if cookies are being set correctly
   - Verify domain is `.payaid.io` for cross-domain cookies
   - Check browser cookie settings

2. **Redirect Loop:**
   - Verify callback URL matches redirect_uri
   - Check OAuth client credentials
   - Verify token exchange is successful

3. **Token Expired:**
   - Check if refresh token is available
   - Verify refresh token endpoint is working
   - Check token expiry time

4. **Module Access Denied:**
   - Verify module is licensed for tenant
   - Check `licensedModules` in JWT payload
   - Verify module ID matches license check

### **Debug Steps:**

1. Check browser cookies (`payaid_token`, `payaid_refresh_token`)
2. Check network requests to OAuth endpoints
3. Verify JWT token payload
4. Check Redis for authorization codes and refresh tokens
5. Review server logs for errors

---

## 📝 **Environment Variables**

### **Core Module:**
```env
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
CORE_AUTH_URL=https://payaid.io
```

### **Module Clients:**
```env
CORE_AUTH_URL=https://payaid.io
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
```

---

## ✅ **Security Considerations**

1. **HTTPS Only:** OAuth2 should only be used over HTTPS in production
2. **Secure Cookies:** Cookies are HTTP-only and secure in production
3. **Token Expiry:** Access tokens expire in 24 hours
4. **Refresh Token Rotation:** Refresh tokens are rotated on each use
5. **CSRF Protection:** State parameter should be used for CSRF protection
6. **Client Credentials:** Client secret should be kept secure

---

## 📚 **Additional Resources**

- [OAuth2 Specification](https://oauth.net/2/)
- [OpenID Connect](https://openid.net/connect/)
- [JWT.io](https://jwt.io/) - JWT token decoder

---

**Status:** ✅ **Complete and Ready for Production**

**Last Updated:** Week 7

