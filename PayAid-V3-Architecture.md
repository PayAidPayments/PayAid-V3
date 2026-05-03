# PayAid V3 - Multi-Tenant SaaS Platform Architecture
## Complete Implementation Guide for Enterprise-Grade Fintech Platform

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Target Implementation:** Cursor AI-Assisted Development  
**Platform:** PayAid Payments Private Limited

---

## TABLE OF CONTENTS

1. [Executive Architecture Overview](#executive-architecture-overview)
2. [Tenant Identification & URL Structure](#tenant-identification--url-structure)
3. [Single Sign-On (SSO) Architecture](#single-sign-on-sso-architecture)
4. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
5. [User Flow & Authentication Journey](#user-flow--authentication-journey)
6. [Module Architecture & Navigation](#module-architecture--navigation)
7. [Admin Panel & Tenant Management](#admin-panel--tenant-management)
8. [Data Isolation & Security](#data-isolation--security)
9. [World-Class Competitive Enhancements](#world-class-competitive-enhancements)
10. [Technical Implementation Stack](#technical-implementation-stack)
11. [Deployment & Infrastructure](#deployment--infrastructure)
12. [API Architecture](#api-architecture)

---

## 1. EXECUTIVE ARCHITECTURE OVERVIEW

### Platform Vision
PayAid V3 is a **white-label, multi-tenant SaaS platform** that consolidates:
- **CRM** (Customer Relationship Management)
- **HR Management** (Employee Management, Payroll, Attendance)
- **Accounting** (Invoicing, Expense Tracking, Financial Reports)
- **Payment Processing** (Gateway Integration)
- **Business Intelligence** (Analytics & Dashboards)
- **Workflow Automation** (n8n-based automation)
- **Communication Hub** (Email, WhatsApp, SMS)

### Core Architecture Principles
```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                           │
│  (Tenant-Specific URL: company.payaid.store)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  TENANT ROUTER LAYER                         │
│  • URL Parsing: Extract tenant identifier                   │
│  • Session Validation: JWT with tenant claims              │
│  • Route Authorization: Tenant context injection            │
└────────────────────┬────────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     ↓               ↓               ↓
┌─────────────┐ ┌──────────┐ ┌────────────┐
│ Admin Panel │ │Module A  │ │Module B    │
│(Global)     │ │(CRM)     │ │(HR)        │
└─────────────┘ └──────────┘ └────────────┘
     │               │               │
     └───────────────┼───────────────┘
                     ↓
        ┌────────────────────────────┐
        │    Multi-Tenant Backend    │
        │  • Tenant-scoped queries   │
        │  • Row-level security      │
        │  • Data isolation          │
        └────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     ↓               ↓               ↓
  Supabase       External APIs    Message Queue
  (PostgreSQL)   (Payment GW)      (n8n/Bull)
```

---

## 2. TENANT IDENTIFICATION & URL STRUCTURE

### URL Architecture

#### Primary Domain Structure
```
https://[TENANT_ID].payaid.store
```

**Examples:**
- `https://acme-corp.payaid.store` - Acme Corporation
- `https://blue-retail.payaid.store` - Blue Retail Store
- `https://xyz-services.payaid.store` - XYZ Services

#### Subdomain vs. Path-Based Routing

**RECOMMENDED: Subdomain-Based (for Enterprise SaaS)**

✅ **Advantages:**
- Separate cookie domains = better security isolation
- Easier to implement per-tenant CDN caching
- Better for white-label implementations
- Industry standard for multi-tenant SaaS
- CORS handling per tenant easier

```
Frontend URL:    https://[tenant-id].payaid.store
API URL:         https://api.payaid.store/v1
Database Schema: public.tenants, public.users, public.[module_tables]
```

**ALTERNATIVE: Path-Based Routing** (if needed)
```
https://payaid.store/tenant/[tenant-id]/
https://payaid.store/t/[tenant-slug]/
```

### Tenant Identifier Strategy

#### Option 1: UUID + Human-Readable Slug (RECOMMENDED)
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_slug": "acme-corp",
  "business_name": "Acme Corporation",
  "industry": "Retail",
  "country": "IN",
  "subscription_tier": "professional",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Implementation:**
```sql
-- Tenants Table Schema
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  industry VARCHAR(50),
  country_code VARCHAR(2) DEFAULT 'IN',
  
  -- Subscription & Features
  subscription_tier VARCHAR(50) DEFAULT 'starter',
  enabled_modules JSONB DEFAULT '["crm","accounting"]',
  max_users INT DEFAULT 5,
  max_storage_gb INT DEFAULT 10,
  
  -- Configuration
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  is_paused BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Index for fast slug lookups
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
```

#### Option 2: Numeric Tenant ID with Slug Mapping
```sql
CREATE TABLE public.tenants (
  tenant_id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  -- ... other fields
);
```

**RECOMMENDATION:** Use UUID for:
- Better security (non-sequential IDs)
- Multi-region support
- Easier migration between databases
- Standards compliance (OAuth 2.0 recommendations)

### Tenant Context Extraction

#### Middleware Implementation (Next.js/Express)

```javascript
// middleware/tenantResolver.js
import { createClient } from '@supabase/supabase-js';

export async function resolveTenant(req) {
  // Extract tenant from subdomain or path
  const host = req.headers.host;
  
  // For subdomain: [tenant-slug].payaid.store
  let tenantSlug;
  
  if (host.includes('payaid.store')) {
    const parts = host.split('.');
    tenantSlug = parts[0]; // e.g., 'acme-corp' from 'acme-corp.payaid.store'
  } else if (req.url.includes('/tenant/')) {
    // Path-based fallback: /tenant/acme-corp/...
    tenantSlug = req.url.split('/tenant/')[1].split('/')[0];
  }
  
  if (!tenantSlug) {
    throw new Error('Invalid tenant context');
  }
  
  // Fetch tenant from database
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Service role for server-side
  );
  
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', tenantSlug)
    .single();
  
  if (error || !tenant) {
    throw new Error('Tenant not found');
  }
  
  // Attach to request context
  req.tenant = tenant;
  req.tenantId = tenant.id;
  req.tenantSlug = tenant.slug;
  
  return tenant;
}

// Usage in API routes or middleware
// req.tenant = { id, slug, business_name, enabled_modules, ... }
```

#### Environment Variables & Configuration

```env
# .env.local
NEXT_PUBLIC_TENANT_DOMAIN=payaid.store
NEXT_PUBLIC_API_URL=https://api.payaid.store
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# For development
DEV_TENANT_SLUG=dev-tenant
DEV_TENANT_ID=550e8400-e29b-41d4-a716-446655440000
```

---

## 3. SINGLE SIGN-ON (SSO) ARCHITECTURE

### Authentication Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   LOGIN PAGE                             │
│  https://acme-corp.payaid.store/auth/login              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
    ┌──────────────────────────────┐
    │   TENANT VERIFICATION        │
    │ • Extract tenant from URL    │
    │ • Verify tenant exists       │
    │ • Check if SSO enabled       │
    └────────────────┬─────────────┘
                     │
        ┌────────────┴────────────┐
        ↓                         ↓
    ┌─────────────┐        ┌──────────────┐
    │ SSO Enabled │        │Email/Password│
    │(SAML/OAuth) │        │    Login     │
    └────────────┬┘        └──────────────┘
                 │                │
                 ↓                ↓
        ┌────────────────────────────┐
        │  CREDENTIALS VALIDATION    │
        │  Against Tenant's IdP       │
        └────────────┬───────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │   TOKEN GENERATION         │
        │  • Access Token (JWT)      │
        │  • Refresh Token           │
        │  • Tenant Claims           │
        └────────────┬───────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │  ROLE & MODULE LOOKUP      │
        │  From user_roles table     │
        │  From rbac_permissions     │
        └────────────┬───────────────┘
                     │
                     ↓
    ┌────────────────────────────────────┐
    │  REDIRECT TO DASHBOARD             │
    │  With auth cookies + localStorage  │
    │  https://acme-corp.payaid.store/   │
    └────────────────────────────────────┘
```

### SSO Configuration Methods

#### Method 1: SAML 2.0 (Enterprise SSO)

**RECOMMENDED FOR: Large organizations with corporate SSO (Azure AD, Okta, Google Workspace)**

```javascript
// lib/saml/samlConfig.js
import { Strategy as SamlStrategy } from 'passport-saml';

export function createSAMLStrategy(tenant) {
  return new SamlStrategy(
    {
      path: `/api/auth/saml/acs/${tenant.slug}`,
      entryPoint: tenant.sso_config.saml_entrypoint,
      issuer: `https://${tenant.slug}.payaid.store`,
      cert: tenant.sso_config.saml_cert,
      identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
      wantAssertionsSigned: true,
    },
    async (profile, done) => {
      try {
        // Extract user info from SAML response
        const email = profile.nameID;
        const firstName = profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'];
        const lastName = profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'];
        
        // Find or create user
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        let { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('email', email)
          .single();
        
        if (!user) {
          // Auto-create user if configured
          if (tenant.sso_config.auto_create_users) {
            const { data: newUser } = await supabase
              .from('users')
              .insert({
                tenant_id: tenant.id,
                email,
                first_name: firstName,
                last_name: lastName,
                sso_provider: 'saml',
                email_verified: true,
              })
              .select()
              .single();
            
            user = newUser;
          }
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  );
}
```

**Database Schema for SAML Configuration:**

```sql
CREATE TABLE public.sso_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- SSO Type
  sso_type VARCHAR(50) DEFAULT 'saml', -- saml, oauth2, oidc
  is_enabled BOOLEAN DEFAULT FALSE,
  
  -- SAML Configuration
  saml_entrypoint TEXT, -- IdP login URL
  saml_issuer VARCHAR(255),
  saml_cert TEXT, -- IdP certificate
  saml_private_key TEXT, -- Optional: SP private key
  
  -- OAuth2 Configuration
  oauth_client_id VARCHAR(255),
  oauth_client_secret VARCHAR(255),
  oauth_authorize_url TEXT,
  oauth_token_url TEXT,
  oauth_userinfo_url TEXT,
  
  -- Attribute Mapping
  email_attribute VARCHAR(100) DEFAULT 'email',
  firstname_attribute VARCHAR(100) DEFAULT 'first_name',
  lastname_attribute VARCHAR(100) DEFAULT 'last_name',
  
  -- User Management
  auto_create_users BOOLEAN DEFAULT TRUE,
  auto_assign_roles BOOLEAN DEFAULT FALSE,
  default_role_on_creation VARCHAR(50) DEFAULT 'user',
  
  -- Restrictions
  allowed_domains JSONB DEFAULT '[]', -- ["@company.com", "@partner.com"]
  deny_domains JSONB DEFAULT '[]',
  require_mfa BOOLEAN DEFAULT FALSE,
  
  -- Session Management
  session_timeout_minutes INT DEFAULT 480, -- 8 hours
  idle_timeout_minutes INT DEFAULT 60,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sso_config_tenant ON public.sso_config(tenant_id);
```

#### Method 2: OAuth 2.0 / OIDC (Google, Microsoft, GitHub)

**RECOMMENDED FOR: Consumer-grade or easy integration with major providers**

```javascript
// lib/oauth/oauthConfig.js
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';

export function createOAuthStrategy(tenant, provider) {
  const strategies = {
    google: () => new GoogleStrategy(
      {
        clientID: tenant.sso_config.oauth_client_id,
        clientSecret: tenant.sso_config.oauth_client_secret,
        callbackURL: `https://${tenant.slug}.payaid.store/api/auth/oauth/${provider}/callback`,
      },
      verifyCallback
    ),
    microsoft: () => new MicrosoftStrategy(
      {
        clientID: tenant.sso_config.oauth_client_id,
        clientSecret: tenant.sso_config.oauth_client_secret,
        callbackURL: `https://${tenant.slug}.payaid.store/api/auth/oauth/${provider}/callback`,
        authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      },
      verifyCallback
    ),
  };
  
  return strategies[provider]();
}

async function verifyCallback(accessToken, refreshToken, profile, done) {
  try {
    // Extract tenant from context
    const tenant = getCurrentTenant(); // From middleware
    
    const email = profile.emails[0].value;
    
    // Find or create user
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('email', email)
      .single();
    
    if (!user && tenant.sso_config.auto_create_users) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          tenant_id: tenant.id,
          email,
          first_name: profile.name.givenName,
          last_name: profile.name.familyName,
          sso_provider: profile.provider,
          sso_id: profile.id,
          email_verified: true,
          avatar_url: profile.photos?.[0]?.value,
        })
        .select()
        .single();
      
      user = newUser;
    }
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}
```

#### Method 3: Email/Password with 2FA (For Tenants Without Enterprise SSO)

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Basic Info
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  
  -- Authentication
  password_hash VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  
  -- SSO Integration
  sso_provider VARCHAR(50), -- 'saml', 'google', 'microsoft', null for email/password
  sso_id VARCHAR(255),
  
  -- Security
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_method VARCHAR(20), -- 'totp', 'sms', 'email'
  mfa_secret VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'inactive'
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_email ON public.users(tenant_id, email);
```

### JWT Token Structure

#### Access Token (15 minutes expiry)
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@acme.com",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
  "tenant_slug": "acme-corp",
  "roles": ["user", "sales_manager"],
  "modules": ["crm", "accounting", "communication"],
  "permissions": [
    "crm:read",
    "crm:create_lead",
    "accounting:read_invoices",
    "communication:send_email"
  ],
  "iat": 1674567890,
  "exp": 1674568790,
  "iss": "payaid.store",
  "aud": "acme-corp.payaid.store"
}
```

#### Refresh Token (7 days expiry)
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
  "type": "refresh",
  "iat": 1674567890,
  "exp": 1675172690
}
```

#### Token Generation Implementation

```javascript
// lib/auth/jwt.js
import jwt from 'jsonwebtoken';

export async function generateTokens(user, tenant, roles, permissions) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      tenant_id: tenant.id,
      tenant_slug: tenant.slug,
      roles,
      modules: tenant.enabled_modules,
      permissions,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',
      issuer: 'payaid.store',
      audience: `${tenant.slug}.payaid.store`,
    }
  );
  
  const refreshToken = jwt.sign(
    {
      sub: user.id,
      tenant_id: tenant.id,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
    }
  );
  
  return { accessToken, refreshToken };
}

export function verifyToken(token, secret = process.env.JWT_SECRET) {
  return jwt.verify(token, secret);
}
```

### Session Management

```javascript
// lib/auth/session.js
import { parse, serialize } from 'cookie';

export function setAuthCookie(res, tokens, tenant) {
  const secureCookie = process.env.NODE_ENV === 'production';
  
  // Access token in httpOnly cookie
  res.setHeader('Set-Cookie', [
    serialize('auth_token', tokens.accessToken, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      domain: `.payaid.store`,
      path: '/',
    }),
    serialize('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      domain: `.payaid.store`,
      path: '/',
    }),
    serialize('tenant_context', tenant.slug, {
      secure: secureCookie,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      domain: `.payaid.store`,
      path: '/',
    }),
  ]);
}

export function getAuthToken(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies.auth_token;
}
```

---

## 4. ROLE-BASED ACCESS CONTROL (RBAC)

### RBAC Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                   USER AUTHENTICATION                         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │   USER PROFILE               │
        │  • Email                     │
        │  • Name                      │
        │  • Department                │
        └──────────┬───────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
    ┌────────────┐      ┌──────────────┐
    │ USER_ROLES │      │ TEAM_MEMBERS │
    │ - admin    │      │ - team_id    │
    │ - manager  │      │ - manager_id │
    │ - user     │      │ - role       │
    └────────────┘      └──────────────┘
        │                     │
        └──────────┬──────────┘
                   ↓
        ┌──────────────────────────────┐
        │   ROLE_PERMISSIONS           │
        │  Defines what each role can  │
        │  do in each module           │
        └──────────┬───────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
    ┌──────────────┐    ┌────────────────┐
    │ PERMISSIONS  │    │MODULE_ACCESS   │
    │- read        │    │- module_id     │
    │- create      │    │- role          │
    │- update      │    │- can_access    │
    │- delete      │    │- can_admin     │
    │- admin       │    └────────────────┘
    └──────────────┘
        │
        ↓
    ┌──────────────────────────────────┐
    │   TOKEN GENERATION               │
    │   (Permissions embedded in JWT)  │
    │   Then: Row-level security RLS   │
    │   in database prevents breaches  │
    └──────────────────────────────────┘
```

### Database Schema for RBAC

```sql
-- Roles: Define job titles/positions
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  role_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Role Type
  role_type VARCHAR(50) DEFAULT 'custom', -- 'admin', 'manager', 'user', 'custom'
  
  -- Permissions (denormalized for performance)
  permissions JSONB DEFAULT '[]',
  
  -- Configuration
  is_system BOOLEAN DEFAULT FALSE, -- Cannot be deleted
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, role_name)
);

-- User Roles: Assign roles to users
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  
  -- Role assignment details
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- For temporary role assignments
  
  -- Additional context
  department VARCHAR(100),
  team_id UUID,
  
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(tenant_id, user_id, role_id)
);

-- Module Access: Control which modules users can access
CREATE TABLE public.module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  
  module_name VARCHAR(100) NOT NULL, -- 'crm', 'hr', 'accounting', etc.
  
  -- Access levels
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_admin BOOLEAN DEFAULT FALSE,
  
  -- Field-level access
  visible_fields JSONB DEFAULT '[]', -- ["email", "phone"] - null = all
  editable_fields JSONB DEFAULT '[]',
  
  -- Record-level access
  view_scope VARCHAR(50) DEFAULT 'own', -- 'own', 'team', 'all', 'none'
  edit_scope VARCHAR(50) DEFAULT 'own', -- Can edit 'own' records or 'all' or 'team'
  
  -- Advanced restrictions
  custom_filters JSONB DEFAULT '{}', -- {"department": "sales"}
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, role_id, module_name)
);

-- Permissions: Define individual permissions
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  permission_code VARCHAR(100) NOT NULL, -- 'crm:read_leads', 'hr:manage_employees'
  description TEXT,
  module_name VARCHAR(100) NOT NULL,
  action VARCHAR(50), -- 'read', 'create', 'update', 'delete', 'admin'
  
  is_system BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, permission_code)
);

-- Role Permissions: Assign permissions to roles
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, role_id, permission_id)
);

-- User Permissions: Direct permission assignment (edge cases)
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  permission_code VARCHAR(100) NOT NULL,
  
  -- Duration
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  reason TEXT,
  
  UNIQUE(tenant_id, user_id, permission_code)
);

-- Create indexes for performance
CREATE INDEX idx_user_roles_tenant_user ON public.user_roles(tenant_id, user_id);
CREATE INDEX idx_module_access_tenant_role ON public.module_access(tenant_id, role_id);
CREATE INDEX idx_role_permissions_tenant_role ON public.role_permissions(tenant_id, role_id);
CREATE INDEX idx_user_permissions_tenant_user ON public.user_permissions(tenant_id, user_id);
```

### Pre-built Role Templates

```sql
-- Admin Role
INSERT INTO public.roles (tenant_id, role_name, description, role_type, is_system)
VALUES (
  'tenant-uuid',
  'Admin',
  'Full system access with tenant management',
  'admin',
  TRUE
);

-- Manager Role
INSERT INTO public.roles (tenant_id, role_name, description, role_type)
VALUES (
  'tenant-uuid',
  'Manager',
  'Can manage team and view reports',
  'manager'
);

-- User Role (Default)
INSERT INTO public.roles (tenant_id, role_name, description, role_type)
VALUES (
  'tenant-uuid',
  'User',
  'Basic access to assigned modules',
  'user'
);

-- Department-specific roles
INSERT INTO public.roles (tenant_id, role_name, description, role_type)
VALUES 
  ('tenant-uuid', 'Sales Manager', 'Manages sales team', 'custom'),
  ('tenant-uuid', 'HR Manager', 'Manages HR operations', 'custom'),
  ('tenant-uuid', 'Accountant', 'Manages accounting records', 'custom');
```

### Permission Structure

```json
{
  "roles": {
    "admin": {
      "crm": ["read", "create", "update", "delete", "admin", "export", "settings"],
      "hr": ["read", "create", "update", "delete", "admin", "payroll_access"],
      "accounting": ["read", "create", "update", "delete", "admin", "reconciliation"],
      "communication": ["read", "create", "update", "delete", "broadcast"],
      "reports": ["read", "create", "update", "delete", "admin"]
    },
    "manager": {
      "crm": ["read", "create", "update", "delete", "export"],
      "hr": ["read", "update"],
      "accounting": ["read"],
      "communication": ["read", "create"]
    },
    "user": {
      "crm": ["read", "create", "update_own"],
      "communication": ["read", "create"],
      "hr": ["read_own"]
    }
  }
}
```

### Permission Checking Implementation

```javascript
// lib/rbac/permissions.js

// Method 1: Token-based (Fast - for API calls)
export function checkPermission(token, requiredPermission) {
  const decoded = jwt.decode(token);
  return decoded.permissions.includes(requiredPermission);
}

// Method 2: Database check (Accurate - for sensitive operations)
export async function checkPermissionDB(userId, tenantId, permissionCode) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Check direct user permission
  const { data: userPerm } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('permission_code', permissionCode)
    .gt('expires_at', 'now()')
    .single();
  
  if (userPerm) return true;
  
  // Check role permissions
  const { data: rolePerm } = await supabase
    .from('user_roles')
    .select(`
      role_id,
      roles!inner (
        role_permissions (
          permissions (
            permission_code
          )
        )
      )
    `)
    .eq('user_id', userId)
    .eq('tenant_id', tenantId);
  
  // Check if any role has the permission
  return rolePerm.some(ur =>
    ur.roles.role_permissions.some(rp =>
      rp.permissions.permission_code === permissionCode
    )
  );
}

// Method 3: Middleware for API protection
export async function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      const token = getAuthToken(req);
      if (!checkPermission(token, permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
```

### Row-Level Security (RLS) in Supabase

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tenant
CREATE POLICY "Users see only own tenant" ON public.users
FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy: CRM leads - Own records only (unless view_scope = 'all')
CREATE POLICY "CRM leads - view own" ON public.crm_leads
FOR SELECT
USING (
  tenant_id = current_setting('app.current_tenant_id')::uuid
  AND (
    created_by = current_setting('app.current_user_id')::uuid
    OR owner_id = current_setting('app.current_user_id')::uuid
    OR current_setting('app.has_crm_admin')::boolean = true
  )
);

-- Policy: Can only update own records
CREATE POLICY "CRM leads - update own" ON public.crm_leads
FOR UPDATE
USING (
  tenant_id = current_setting('app.current_tenant_id')::uuid
  AND (
    owner_id = current_setting('app.current_user_id')::uuid
    OR current_setting('app.has_crm_admin')::boolean = true
  )
)
WITH CHECK (
  tenant_id = current_setting('app.current_tenant_id')::uuid
);

-- Set tenant context before any query
-- In your API middleware:
await supabase.rpc('set_claim', {
  claim: 'app.current_tenant_id',
  value: tenantId
});

await supabase.rpc('set_claim', {
  claim: 'app.current_user_id',
  value: userId
});
```

---

## 5. USER FLOW & AUTHENTICATION JOURNEY

### Complete User Journey Map

```
                    ┌─────────────────────────────────┐
                    │   FIRST TIME USER               │
                    │  (New Tenant Registration)      │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ↓                             ↓
            ┌──────────────┐          ┌──────────────────┐
            │  Sign Up     │          │ Onboarding Flow  │
            │  Form        │          │                  │
            └──────┬───────┘          └────────┬─────────┘
                   │                           │
                   └──────────┬────────────────┘
                              ↓
                   ┌──────────────────────┐
                   │  Email Verification  │
                   │  (OTP/Link)          │
                   └──────────┬───────────┘
                              ↓
                   ┌──────────────────────────────┐
                   │  Tenant Setup                │
                   │  • Business Name             │
                   │  • Industry                  │
                   │  • Timezone                  │
                   │  • SSO Configuration         │
                   │  • Module Selection          │
                   └──────────┬───────────────────┘
                              │
                   ┌──────────┴──────────┐
                   ↓                     ↓
            ┌──────────────┐    ┌──────────────┐
            │ Create Admin │    │ Complete     │
            │ User         │    │ Onboarding   │
            └──────┬───────┘    └──────┬───────┘
                   │                   │
                   └──────────┬────────┘
                              ↓
                   ┌──────────────────────┐
                   │  Redirect to Admin   │
                   │  Dashboard           │
                   └──────────┬───────────┘
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
          ↓                                       ↓
    ┌──────────────┐                    ┌──────────────────┐
    │  RETURNING   │                    │  ADMIN SETUP     │
    │  USER LOGIN  │                    │  • Add Employees │
    │              │                    │  • Configure SSO │
    │              │                    │  • Set Roles     │
    └──────┬───────┘                    │  • Enable Module │
           │                            └────────┬─────────┘
           │                                     │
    ┌──────┴─────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────┐
│  LOGIN PAGE                       │
│  https://acme.payaid.store/login │
└──────────┬───────────────────────┘
           │
    ┌──────┴──────────┐
    ↓                 ↓
┌─────────────┐  ┌──────────────┐
│ Email/Pass  │  │   SSO Login  │
│ Or 2FA      │  │  (SAML/OAuth)│
└──────┬──────┘  └──────┬───────┘
       │                │
       └───────┬────────┘
               ↓
        ┌─────────────────┐
        │  JWT Generation │
        │  + Token Refresh│
        └────────┬────────┘
                 │
    ┌────────────┴────────────┐
    ↓                         ↓
┌──────────────┐      ┌───────────────┐
│ Access Token │      │ Refresh Token │
│ (15 min)     │      │ (7 days)      │
└──────┬───────┘      └───────┬───────┘
       │                      │
       └──────────┬───────────┘
                  ↓
       ┌──────────────────────┐
       │  Set HTTP-Only       │
       │  Cookies             │
       └──────────┬───────────┘
                  │
                  ↓
    ┌─────────────────────────────┐
    │  DASHBOARD REDIRECT         │
    │  with Module Context        │
    └────────────┬────────────────┘
                 │
     ┌───────────┴────────────┐
     ↓                        ↓
┌─────────────┐       ┌────────────────┐
│ Auto-Select │       │ User Chooses   │
│ First Module│       │ Which Module   │
│ If 1 Enabled│       │ To Access      │
└──────┬──────┘       └────────┬───────┘
       │                       │
       └───────────┬───────────┘
                   ↓
        ┌──────────────────────┐
        │  MODULE DASHBOARD    │
        │  Based on Permissions│
        │  & Role              │
        └──────────────────────┘
```

### Login API Flow

```javascript
// pages/api/auth/login.js
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { generateTokens, setAuthCookie } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { email, password, tenantSlug } = req.body;
  
  try {
    // 1. Resolve tenant
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', tenantSlug)
      .single();
    
    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // 2. Find user in tenant
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('email', email)
      .single();
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 3. Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive or suspended' });
    }
    
    // 4. Verify password
    if (!user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      // Log failed attempt
      await supabase
        .from('users')
        .update({ failed_login_attempts: user.failed_login_attempts + 1 })
        .eq('id', user.id);
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 5. Check if user is locked (too many failed attempts)
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(429).json({ error: 'Account locked. Try again later.' });
    }
    
    // 6. Check if MFA is enabled
    if (user.mfa_enabled) {
      // Send MFA code and return temporary token
      const mfaToken = jwt.sign(
        { sub: user.id, type: 'mfa' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      
      // Send MFA code via SMS/Email based on mfa_method
      if (user.mfa_method === 'sms') {
        await sendSMSCode(user.phone, generateMFACode());
      } else {
        await sendEmailCode(user.email, generateMFACode());
      }
      
      return res.status(200).json({
        mfa_required: true,
        mfa_token: mfaToken,
        mfa_method: user.mfa_method,
      });
    }
    
    // 7. Get user roles and permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles (
          id,
          role_name,
          permissions
        )
      `)
      .eq('user_id', user.id)
      .eq('tenant_id', tenant.id);
    
    const roles = userRoles.map(ur => ur.roles.role_name);
    const permissions = extractPermissions(userRoles);
    
    // 8. Generate tokens
    const { accessToken, refreshToken } = await generateTokens(
      user,
      tenant,
      roles,
      permissions
    );
    
    // 9. Set cookies
    setAuthCookie(res, { accessToken, refreshToken }, tenant);
    
    // 10. Update last login
    await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        last_login_ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        failed_login_attempts: 0,
      })
      .eq('id', user.id);
    
    // 11. Return success with user context
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        business_name: tenant.business_name,
        enabled_modules: tenant.enabled_modules,
      },
      roles,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Token Refresh Flow

```javascript
// pages/api/auth/refresh.js
export default async function handler(req, res) {
  try {
    const refreshToken = getAuthToken(req, 'refresh_token');
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Get current user and tenant
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.sub)
      .single();
    
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', decoded.tenant_id)
      .single();
    
    if (!user || !tenant) {
      return res.status(401).json({ error: 'User or tenant not found' });
    }
    
    // Get updated roles and permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        roles (
          role_name,
          permissions
        )
      `)
      .eq('user_id', user.id);
    
    const roles = userRoles.map(ur => ur.roles.role_name);
    const permissions = extractPermissions(userRoles);
    
    // Generate new access token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        roles,
        modules: tenant.enabled_modules,
        permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // Set new token in cookie
    res.setHeader(
      'Set-Cookie',
      serialize('auth_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60,
      })
    );
    
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(401).json({ error: 'Token refresh failed' });
  }
}
```

---

## 6. MODULE ARCHITECTURE & NAVIGATION

### Module System Design

```
┌─────────────────────────────────────────────────────────┐
│              PAYAID V3 MODULE ARCHITECTURE              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│            CORE INFRASTRUCTURE LAYER                     │
│  • Authentication & Authorization                       │
│  • Data Isolation & Multi-tenancy                       │
│  • Audit Logging                                        │
│  • API Gateway & Rate Limiting                          │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
    ┌────────┐        ┌────────┐        ┌────────┐
    │  CRM   │        │   HR   │        │ACCOUNT │
    │MODULE  │        │MODULE  │        │  ING   │
    └─┬──────┘        └─┬──────┘        └─┬──────┘
      │                 │                 │
      ├─ Leads          ├─ Employees      ├─ Invoices
      ├─ Deals          ├─ Attendance     ├─ Expenses
      ├─ Customers      ├─ Payroll        ├─ Reports
      ├─ Pipeline       ├─ Documents      └─ Reconciliation
      └─ Activities     └─ Performance

    ┌────────┐        ┌────────┐        ┌────────┐
    │PAYMENT │        │REPORT  │        │ COMM   │
    │GATEWAY │        │ENGINE  │        │MODULE  │
    └─┬──────┘        └─┬──────┘        └─┬──────┘
      │                 │                 │
      ├─ Transactions   ├─ Custom Reports ├─ Email
      ├─ Settlements    ├─ Dashboards     ├─ WhatsApp
      ├─ Disputes       ├─ Exports        ├─ SMS
      └─ Reconciliation └─ Analytics      └─ Templates

        ┌────────┐        ┌────────┐
        │ WORKFLOW│        │ ANALYTICS│
        │AUTOMTN │        │ ENGINE │
        └────────┘        └────────┘
```

### Module Structure (Each Module Follows This Pattern)

```
/modules/crm/
├── components/
│   ├── LeadsList.jsx
│   ├── LeadDetail.jsx
│   ├── LeadForm.jsx
│   ├── DealsKanban.jsx
│   └── PipelineView.jsx
├── hooks/
│   ├── useCRMData.js
│   ├── useCRMPermissions.js
│   └── useCRMNotifications.js
├── store/
│   ├── crm.store.js (Zustand state management)
│   └── crm.actions.js
├── api/
│   ├── leads.js
│   ├── deals.js
│   ├── activities.js
│   └── pipeline.js
├── pages/
│   ├── index.jsx (CRM Dashboard)
│   ├── leads.jsx
│   ├── deals.jsx
│   ├── [leadId].jsx
│   └── settings.jsx
├── types/
│   └── crm.types.ts
└── utils/
    ├── crmCalculations.js
    ├── crmFormatters.js
    └── crmValidations.js
```

### Module Navigation Architecture

```javascript
// lib/modules/moduleRegistry.js
export const MODULE_REGISTRY = {
  crm: {
    id: 'crm',
    name: 'CRM',
    description: 'Customer Relationship Management',
    icon: 'Users',
    order: 1,
    enabled_by_default: true,
    category: 'core',
    routes: [
      { path: '/crm', label: 'Dashboard' },
      { path: '/crm/leads', label: 'Leads' },
      { path: '/crm/deals', label: 'Deals' },
      { path: '/crm/customers', label: 'Customers' },
      { path: '/crm/pipeline', label: 'Pipeline' },
      { path: '/crm/activities', label: 'Activities' },
      { path: '/crm/settings', label: 'Settings' },
    ],
    required_permissions: ['crm:read'],
    admin_only_routes: ['/crm/settings', '/crm/integration'],
  },
  hr: {
    id: 'hr',
    name: 'HR Management',
    description: 'Employee Management & Payroll',
    icon: 'Users2',
    order: 2,
    enabled_by_default: true,
    category: 'core',
    routes: [
      { path: '/hr', label: 'Dashboard' },
      { path: '/hr/employees', label: 'Employees' },
      { path: '/hr/attendance', label: 'Attendance' },
      { path: '/hr/payroll', label: 'Payroll' },
      { path: '/hr/leave', label: 'Leave Management' },
      { path: '/hr/performance', label: 'Performance' },
      { path: '/hr/settings', label: 'Settings' },
    ],
    required_permissions: ['hr:read'],
    admin_only_routes: ['/hr/payroll', '/hr/settings'],
  },
  accounting: {
    id: 'accounting',
    name: 'Accounting',
    description: 'Financial Management & Invoicing',
    icon: 'DollarSign',
    order: 3,
    enabled_by_default: true,
    category: 'core',
    routes: [
      { path: '/accounting', label: 'Dashboard' },
      { path: '/accounting/invoices', label: 'Invoices' },
      { path: '/accounting/expenses', label: 'Expenses' },
      { path: '/accounting/reports', label: 'Reports' },
      { path: '/accounting/settings', label: 'Settings' },
    ],
    required_permissions: ['accounting:read'],
  },
  communication: {
    id: 'communication',
    name: 'Communication',
    description: 'Email, WhatsApp, SMS',
    icon: 'MessageSquare',
    order: 4,
    enabled_by_default: false,
    category: 'addon',
    routes: [
      { path: '/communication', label: 'Dashboard' },
      { path: '/communication/email', label: 'Email' },
      { path: '/communication/whatsapp', label: 'WhatsApp' },
      { path: '/communication/sms', label: 'SMS' },
      { path: '/communication/templates', label: 'Templates' },
    ],
    required_permissions: ['communication:read'],
  },
  reports: {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Business Intelligence',
    icon: 'BarChart3',
    order: 5,
    enabled_by_default: false,
    category: 'addon',
    routes: [
      { path: '/reports', label: 'Dashboard' },
      { path: '/reports/custom', label: 'Custom Reports' },
      { path: '/reports/analytics', label: 'Analytics' },
      { path: '/reports/exports', label: 'Exports' },
    ],
    required_permissions: ['reports:read'],
  },
};

// Get enabled modules for current tenant
export function getEnabledModules(tenant, userRoles) {
  return Object.values(MODULE_REGISTRY).filter(module => {
    return tenant.enabled_modules.includes(module.id);
  });
}

// Get accessible routes based on user permissions
export function getAccessibleRoutes(user, tenant) {
  const enabledModules = getEnabledModules(tenant, user.roles);
  const routes = [];
  
  enabledModules.forEach(module => {
    const moduleRoutes = module.routes.filter(route => {
      // Check if user has required permission for route
      const hasPermission = user.permissions.some(perm => 
        module.required_permissions.includes(perm)
      );
      
      // Check if route is admin-only
      if (module.admin_only_routes?.includes(route.path)) {
        return user.roles.includes('admin') && hasPermission;
      }
      
      return hasPermission;
    });
    
    routes.push({
      module: module.id,
      moduleName: module.name,
      moduleIcon: module.icon,
      routes: moduleRoutes,
    });
  });
  
  return routes;
}
```

### Module Navigation Component

```jsx
// components/Navigation/ModuleNavigation.jsx
import { useAuth } from '@/contexts/AuthContext';
import { getAccessibleRoutes, MODULE_REGISTRY } from '@/lib/modules/moduleRegistry';
import Link from 'next/link';
import { useRouter } from 'next/router';

export function ModuleNavigation() {
  const { user, tenant } = useAuth();
  const router = useRouter();
  
  const accessibleRoutes = getAccessibleRoutes(user, tenant);
  const currentModule = router.pathname.split('/')[1];
  
  return (
    <nav className="module-navigation">
      <div className="module-switcher">
        <div className="current-module">
          <span className="module-label">Modules</span>
        </div>
        
        {/* Module Grid */}
        <div className="module-grid">
          {accessibleRoutes.map(({ module, moduleName, moduleIcon, routes }) => {
            const moduleConfig = MODULE_REGISTRY[module];
            const isActive = currentModule === module;
            
            return (
              <div 
                key={module} 
                className={`module-item ${isActive ? 'active' : ''}`}
              >
                <Link href={routes[0].path}>
                  <div className="module-card">
                    <div className="module-icon">
                      {/* Icon component */}
                    </div>
                    <h3>{moduleName}</h3>
                    <p>{moduleConfig.description}</p>
                  </div>
                </Link>
                
                {isActive && (
                  <div className="module-submenu">
                    {routes.map(route => (
                      <Link 
                        key={route.path} 
                        href={route.path}
                        className={router.pathname === route.path ? 'active' : ''}
                      >
                        {route.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
```

### Module Switching Flow

```javascript
// pages/api/modules/switch.js
export default async function handler(req, res) {
  const { moduleId } = req.body;
  const { user, tenant } = req;
  
  // 1. Verify module is enabled for tenant
  if (!tenant.enabled_modules.includes(moduleId)) {
    return res.status(403).json({ error: 'Module not enabled' });
  }
  
  // 2. Verify user has access
  const moduleConfig = MODULE_REGISTRY[moduleId];
  const hasPermission = user.permissions.some(perm =>
    moduleConfig.required_permissions.includes(perm)
  );
  
  if (!hasPermission) {
    return res.status(403).json({ error: 'No access to module' });
  }
  
  // 3. Log module access for analytics
  await logModuleAccess(user.id, moduleId, tenant.id);
  
  // 4. Return module context
  return res.status(200).json({
    module: moduleId,
    config: moduleConfig,
    routes: getAccessibleRoutes(user, tenant).find(r => r.module === moduleId),
  });
}
```

---

## 7. ADMIN PANEL & TENANT MANAGEMENT

### Admin Dashboard Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              ADMIN DASHBOARD                                 │
│         (Global - Not Tenant-Specific)                       │
│         https://admin.payaid.store OR /admin                │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         ADMIN NAVIGATION (Separated from Tenant)            │
└─────────────────────────────────────────────────────────────┘
        │
    ┌───┴───┬──────────┬────────────┬──────────┐
    ↓       ↓          ↓            ↓          ↓
┌────────┬────────┬────────┬────────┬────────┐
│Tenants │ Users  │Modules │Billing │Reports │
│Mgmt    │Mgmt    │Control │Config  │&Logs   │
└───┬────┴──┬─────┴──┬─────┴────┬───┴────┬───┘
    │       │        │          │        │
    ├─List  │        │          │        │
    ├─Create│        │          │        │
    ├─Edit  │        │          │        │
    ├─Delete│        │          │        │
    └─Config│        │          │        │
```

### Admin Routes (Super Admin Only)

```javascript
// lib/admin/adminRoutes.js
export const ADMIN_ROUTES = {
  TENANTS: {
    LIST: '/admin/tenants',
    CREATE: '/admin/tenants/new',
    EDIT: '/admin/tenants/[tenantId]/edit',
    SETTINGS: '/admin/tenants/[tenantId]/settings',
    USERS: '/admin/tenants/[tenantId]/users',
    MODULES: '/admin/tenants/[tenantId]/modules',
    BILLING: '/admin/tenants/[tenantId]/billing',
  },
  USERS: {
    LIST: '/admin/users',
    DETAILS: '/admin/users/[userId]',
  },
  MODULES: {
    MANAGEMENT: '/admin/modules',
    ENABLE: '/admin/modules/[moduleId]/enable',
    CONFIGURE: '/admin/modules/[moduleId]/config',
  },
  SYSTEM: {
    SETTINGS: '/admin/settings',
    LOGS: '/admin/logs',
    HEALTH: '/admin/health',
    INTEGRATIONS: '/admin/integrations',
  },
};

// Authentication: Only Super Admin can access
export async function requireSuperAdmin(req, res, next) {
  const token = getAuthToken(req);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // Check if user is super admin (tenant_id = null means super admin)
  if (decoded.tenant_id !== null || !decoded.roles.includes('super_admin')) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  
  next();
}
```

### Tenant Management Interface

```sql
-- Super Admin User (Special user with tenant_id = NULL)
CREATE TABLE public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  password_hash VARCHAR(255),
  
  role VARCHAR(50) DEFAULT 'admin', -- 'admin', 'support', 'finance'
  
  permissions JSONB DEFAULT '[]',
  
  last_login_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenant Admin (Admin of specific tenant)
-- This is just a regular user with 'admin' role in user_roles table
-- WHERE tenant_id IS NOT NULL

-- Audit log for admin actions
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  admin_id UUID NOT NULL REFERENCES super_admins(id),
  admin_email VARCHAR(255),
  
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50), -- 'tenant', 'user', 'module', etc.
  resource_id UUID,
  
  changes JSONB, -- Before and after values
  
  status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed'
  error_message TEXT,
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Admin API: Enable/Disable Modules for Tenant

```javascript
// pages/api/admin/tenants/[tenantId]/modules.js
import { requireSuperAdmin } from '@/lib/admin/adminRoutes';

export default async function handler(req, res) {
  await requireSuperAdmin(req, res, () => {});
  
  const { tenantId } = req.query;
  
  if (req.method === 'GET') {
    // Get tenant's enabled modules
    const { data: tenant } = await supabase
      .from('tenants')
      .select('enabled_modules, subscription_tier')
      .eq('id', tenantId)
      .single();
    
    const allModules = Object.values(MODULE_REGISTRY);
    const enabledModules = tenant.enabled_modules;
    
    // Get subscription tier limits
    const tierLimits = SUBSCRIPTION_TIERS[tenant.subscription_tier];
    
    return res.status(200).json({
      tenant_id: tenantId,
      enabled_modules: enabledModules,
      available_modules: allModules.map(m => ({
        id: m.id,
        name: m.name,
        enabled: enabledModules.includes(m.id),
        included_in_tier: tierLimits.modules.includes(m.id),
        requires_extra_cost: !tierLimits.modules.includes(m.id),
      })),
      subscription_tier: tenant.subscription_tier,
    });
  }
  
  if (req.method === 'PUT') {
    // Enable/Disable modules
    const { moduleId, enabled } = req.body;
    
    // Validate module exists
    if (!MODULE_REGISTRY[moduleId]) {
      return res.status(400).json({ error: 'Invalid module' });
    }
    
    // Get tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    
    // Check subscription allows this module
    const tierLimits = SUBSCRIPTION_TIERS[tenant.subscription_tier];
    if (enabled && !tierLimits.modules.includes(moduleId)) {
      return res.status(403).json({ 
        error: 'Module not included in subscription tier',
        required_tier: getMinimumTierForModule(moduleId),
      });
    }
    
    // Update enabled_modules
    const updatedModules = enabled
      ? [...new Set([...tenant.enabled_modules, moduleId])]
      : tenant.enabled_modules.filter(m => m !== moduleId);
    
    const { data: updated, error } = await supabase
      .from('tenants')
      .update({ enabled_modules: updatedModules })
      .eq('id', tenantId)
      .select()
      .single();
    
    // Log action
    await logAdminAction({
      admin_id: req.admin.id,
      action: enabled ? 'enable_module' : 'disable_module',
      resource_type: 'module',
      resource_id: moduleId,
      changes: {
        before: tenant.enabled_modules,
        after: updatedModules,
      },
    });
    
    return res.status(200).json({
      success: true,
      tenant: updated,
    });
  }
}
```

### Add/Remove Users in Tenant

```javascript
// pages/api/admin/tenants/[tenantId]/users.js
import { requireSuperAdmin } from '@/lib/admin/adminRoutes';

export default async function handler(req, res) {
  await requireSuperAdmin(req, res, () => {});
  
  const { tenantId } = req.query;
  
  if (req.method === 'POST') {
    // Add new user to tenant
    const { email, first_name, last_name, role, department } = req.body;
    
    // Verify tenant exists
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Check user limit
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);
    
    if (userCount >= tenant.max_users) {
      return res.status(400).json({ 
        error: 'User limit reached for this subscription',
        limit: tenant.max_users,
      });
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash(generatePassword(), 10);
    
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        tenant_id: tenantId,
        email,
        first_name,
        last_name,
        password_hash: hashedPassword,
        status: 'active',
        email_verified: false,
      })
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Assign role if provided
    if (role) {
      const { data: roleRecord } = await supabase
        .from('roles')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('role_name', role)
        .single();
      
      if (roleRecord) {
        await supabase
          .from('user_roles')
          .insert({
            tenant_id: tenantId,
            user_id: newUser.id,
            role_id: roleRecord.id,
            department,
          });
      }
    }
    
    // Send invitation email
    await sendInvitationEmail(newUser.email, newUser.id, tenantId);
    
    // Log action
    await logAdminAction({
      admin_id: req.admin.id,
      action: 'create_user',
      resource_type: 'user',
      resource_id: newUser.id,
    });
    
    return res.status(201).json({
      success: true,
      user: newUser,
    });
  }
  
  if (req.method === 'DELETE') {
    // Remove user from tenant
    const { userId } = req.body;
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .eq('tenant_id', tenantId);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Log action
    await logAdminAction({
      admin_id: req.admin.id,
      action: 'delete_user',
      resource_type: 'user',
      resource_id: userId,
    });
    
    return res.status(200).json({ success: true });
  }
}
```

### Admin: Assign Roles to Users in Tenant

```javascript
// pages/api/admin/tenants/[tenantId]/users/[userId]/roles.js

export default async function handler(req, res) {
  await requireSuperAdmin(req, res, () => {});
  
  const { tenantId, userId } = req.query;
  
  if (req.method === 'POST') {
    // Assign role to user
    const { roleId, department } = req.body;
    
    // Verify role belongs to tenant
    const { data: role } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .eq('tenant_id', tenantId)
      .single();
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Check if already assigned
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role_id', roleId)
      .single();
    
    if (existingRole) {
      return res.status(400).json({ error: 'User already has this role' });
    }
    
    // Assign role
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role_id: roleId,
        department,
        assigned_by: req.admin.id,
      })
      .select()
      .single();
    
    // Invalidate user's auth token to refresh permissions
    await invalidateUserSessions(userId, tenantId);
    
    return res.status(201).json({ success: true, user_role: userRole });
  }
  
  if (req.method === 'DELETE') {
    // Remove role from user
    const { roleId } = req.body;
    
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId)
      .eq('tenant_id', tenantId);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Invalidate token
    await invalidateUserSessions(userId, tenantId);
    
    return res.status(200).json({ success: true });
  }
}
```

---

## 8. DATA ISOLATION & SECURITY

### Row-Level Security (RLS) Strategy

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_expenses ENABLE ROW LEVEL SECURITY;

-- TENANT ISOLATION: Users can only see users from same tenant
CREATE POLICY "Users see same tenant" ON public.users
FOR SELECT
USING (tenant_id = (SELECT current_setting('app.tenant_id')::uuid));

-- CRM LEADS: Based on user role and assignment
CREATE POLICY "CRM leads - view access" ON public.crm_leads
FOR SELECT
USING (
  tenant_id = (SELECT current_setting('app.tenant_id')::uuid)
  AND (
    -- Case 1: User is admin
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT current_setting('app.user_id')::uuid)
        AND r.role_name = 'admin'
    )
    -- Case 2: User is owner
    OR owner_id = (SELECT current_setting('app.user_id')::uuid)
    -- Case 3: User's team is assigned
    OR team_id = (
      SELECT team_id FROM public.user_roles
      WHERE user_id = (SELECT current_setting('app.user_id')::uuid)
        AND tenant_id = (SELECT current_setting('app.tenant_id')::uuid)
    )
    -- Case 4: Lead is assigned to user
    OR assigned_to = (SELECT current_setting('app.user_id')::uuid)
    -- Case 5: Role has 'view_all' permission
    OR EXISTS (
      SELECT 1 FROM public.module_access ma
      WHERE ma.role_id IN (
        SELECT role_id FROM public.user_roles
        WHERE user_id = (SELECT current_setting('app.user_id')::uuid)
      )
      AND ma.module_name = 'crm'
      AND ma.view_scope = 'all'
    )
  )
);

-- CRM LEADS: Update access (stricter)
CREATE POLICY "CRM leads - update access" ON public.crm_leads
FOR UPDATE
USING (
  tenant_id = (SELECT current_setting('app.tenant_id')::uuid)
  AND (
    -- Admin can update anything
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT current_setting('app.user_id')::uuid)
        AND r.role_name = 'admin'
    )
    -- User can update own leads
    OR owner_id = (SELECT current_setting('app.user_id')::uuid)
  )
)
WITH CHECK (
  tenant_id = (SELECT current_setting('app.tenant_id')::uuid)
);

-- CRM LEADS: Delete access (most restrictive)
CREATE POLICY "CRM leads - delete access" ON public.crm_leads
FOR DELETE
USING (
  tenant_id = (SELECT current_setting('app.tenant_id')::uuid)
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = (SELECT current_setting('app.user_id')::uuid)
      AND r.role_name = 'admin'
  )
);
```

### Setting RLS Context Before Queries

```javascript
// middleware/rls.middleware.js
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export async function setRLSContext(req) {
  const token = getAuthToken(req);
  
  if (!token) {
    throw new Error('No auth token');
  }
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // Create a Supabase client with the user's auth token
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Set RLS context variables
  await supabase.rpc('set_claim', {
    claim: 'app.tenant_id',
    value: decoded.tenant_id,
  });
  
  await supabase.rpc('set_claim', {
    claim: 'app.user_id',
    value: decoded.sub,
  });
  
  // Return client that will use RLS
  return supabase;
}

// Usage in API route:
export default async function handler(req, res) {
  const supabase = await setRLSContext(req);
  
  // This query automatically respects RLS policies
  const { data: leads } = await supabase
    .from('crm_leads')
    .select('*');
  
  // User only sees leads they're authorized to see
}
```

### Tenant Data Isolation Best Practices

```javascript
// lib/db/tenantAware.js
export class TenantAwareDB {
  constructor(supabaseClient, tenantId) {
    this.supabase = supabaseClient;
    this.tenantId = tenantId;
  }
  
  // Every query automatically filters by tenant_id
  async select(table, columns = '*') {
    return this.supabase
      .from(table)
      .select(columns)
      .eq('tenant_id', this.tenantId);
  }
  
  async insert(table, data) {
    return this.supabase
      .from(table)
      .insert({ ...data, tenant_id: this.tenantId });
  }
  
  async update(table, data, id) {
    return this.supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .eq('tenant_id', this.tenantId);
  }
  
  async delete(table, id) {
    return this.supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('tenant_id', this.tenantId);
  }
}

// Usage:
const db = new TenantAwareDB(supabase, tenantId);
const leads = await db.select('crm_leads');
// Automatically filters: WHERE tenant_id = tenantId
```

### Encryption for Sensitive Data

```javascript
// lib/encryption/dataEncryption.js
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const keyLength = 32;

export function encryptSensitiveData(plaintext, encryptionKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex'),
  };
}

export function decryptSensitiveData(encryptedData, encryptionKey) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    encryptionKey,
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// For sensitive fields like bank details, API keys
// Store encrypted in database, decrypt only when needed
```

---

## 9. WORLD-CLASS COMPETITIVE ENHANCEMENTS

### 1. Advanced Analytics & Insights

```sql
-- Tenant Analytics Dashboard
CREATE TABLE public.tenant_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  analytics_date DATE NOT NULL,
  
  -- Metrics
  active_users INT,
  new_leads INT,
  deals_closed INT,
  revenue_generated DECIMAL(15, 2),
  
  -- Module usage
  module_usage JSONB, -- {"crm": 85, "hr": 60, "accounting": 75}
  
  -- Performance
  avg_response_time_ms INT,
  error_rate DECIMAL(5, 2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, analytics_date)
);

-- Real-time dashboards with aggregated metrics
```

### 2. AI-Powered Insights & Recommendations

```javascript
// lib/ai/insights.js
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export async function generateBusinessInsights(tenantId) {
  // Fetch data
  const salesData = await getSalesMetrics(tenantId);
  const crmData = await getCRMMetrics(tenantId);
  const hrData = await getHRMetrics(tenantId);
  
  // Send to Claude for analysis
  const client = new Anthropic();
  
  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyze this business data and provide 3-5 actionable insights and recommendations:\n\n
        Sales Data: ${JSON.stringify(salesData)}
        CRM Data: ${JSON.stringify(crmData)}
        HR Data: ${JSON.stringify(hrData)}
        
        Format as JSON with fields: insight, impact, recommendation, priority (high/medium/low)`,
      },
    ],
  });
  
  const insights = JSON.parse(message.content[0].text);
  
  // Cache insights for 24 hours
  await cacheInsights(tenantId, insights);
  
  return insights;
}

// Endpoint for insights
// GET /api/insights/recommendations
```

### 3. Workflow Automation (n8n Integration)

```sql
-- Store automation workflows
CREATE TABLE public.automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Triggers
  trigger_type VARCHAR(100), -- 'on_lead_created', 'on_invoice_due', etc.
  trigger_config JSONB,
  
  -- Actions
  actions JSONB, -- Array of actions to execute
  
  -- n8n Integration
  n8n_workflow_id VARCHAR(255),
  n8n_export JSONB, -- Exported workflow for n8n
  
  is_active BOOLEAN DEFAULT TRUE,
  execution_count INT DEFAULT 0,
  last_executed_at TIMESTAMP,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, name)
);

-- Execution logs
CREATE TABLE public.automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id),
  
  trigger_event_id UUID,
  trigger_data JSONB,
  
  status VARCHAR(20), -- 'pending', 'running', 'success', 'failed'
  
  results JSONB,
  error_message TEXT,
  
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);
```

### 4. Multi-Currency & Localization

```sql
-- Tenant Currency Configuration
CREATE TABLE public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Localization
  primary_currency VARCHAR(3) DEFAULT 'INR',
  supported_currencies JSONB DEFAULT '["INR", "USD", "EUR"]',
  
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  language VARCHAR(10) DEFAULT 'en',
  
  -- Formatting
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(20) DEFAULT '24h',
  decimal_separator VARCHAR(1) DEFAULT '.',
  thousands_separator VARCHAR(1) DEFAULT ',',
  
  -- Regional
  country_code VARCHAR(2),
  
  UNIQUE(tenant_id)
);

-- Multi-currency transaction support
ALTER TABLE accounting_invoices ADD COLUMN currency VARCHAR(3);
ALTER TABLE accounting_invoices ADD COLUMN amount_in_base_currency DECIMAL(15, 2);
```

### 5. Advanced Reporting & Export

```javascript
// lib/reports/reportGenerator.js
export async function generateCustomReport(tenantId, config) {
  const {
    reportType, // 'sales', 'financial', 'hr_analytics'
    dateRange,
    filters,
    groupBy,
    metrics,
    format, // 'pdf', 'excel', 'csv'
  } = config;
  
  // Fetch data based on config
  const data = await fetchReportData(tenantId, config);
  
  // Generate report
  let report;
  
  if (format === 'pdf') {
    report = await generatePDFReport(data, config);
  } else if (format === 'excel') {
    report = await generateExcelReport(data, config);
  } else {
    report = generateCSVReport(data, config);
  }
  
  // Store report for download
  const { data: file, error } = await supabase
    .storage
    .from('reports')
    .upload(`${tenantId}/${uuidv4()}.${format}`, report);
  
  return file;
}

// Scheduled reports
export async function scheduleReport(tenantId, config) {
  // Create cron job to generate report
  // Send via email automatically
}
```

### 6. Real-Time Collaboration & Notifications

```javascript
// lib/realtime/collaboration.js
import { createClient } from '@supabase/supabase-js';

export function setupRealtimeSync(tenantId, tableId) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  // Subscribe to changes
  const subscription = supabase
    .channel(`${tenantId}:${tableId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableId,
        filter: `tenant_id=eq.${tenantId}`,
      },
      (payload) => {
        // Real-time update
        dispatchUpdate(payload);
      }
    )
    .subscribe();
  
  return subscription;
}

// Activity notifications
export async function notifyTeamActivity(tenantId, activity) {
  // Send to team via WebSocket
  // Store in activity feed
  // Create notifications for relevant users
}
```

### 7. Audit Logging & Compliance

```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  
  action VARCHAR(100), -- 'create', 'update', 'delete', 'view', 'export'
  resource_type VARCHAR(50), -- 'lead', 'invoice', 'employee'
  resource_id UUID,
  
  -- Changes
  before_values JSONB,
  after_values JSONB,
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_id VARCHAR(255),
  
  -- Compliance
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_status VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance: Keep logs for 7 years
CREATE INDEX idx_audit_logs_tenant_date ON public.audit_logs(tenant_id, created_at);
```

### 8. Advanced Permission Hierarchies

```javascript
// lib/rbac/hierarchies.js
export const PERMISSION_HIERARCHIES = {
  'crm:read': {
    level: 1,
    includes: ['crm:view'],
  },
  'crm:write': {
    level: 2,
    includes: ['crm:read', 'crm:view', 'crm:create'],
  },
  'crm:admin': {
    level: 3,
    includes: ['crm:write', 'crm:read', 'crm:delete', 'crm:settings'],
  },
};

// Permission inheritance
export function hasPermission(userPermissions, requiredPermission) {
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }
  
  // Check if higher-level permission includes this one
  const hierarchy = PERMISSION_HIERARCHIES[requiredPermission];
  if (hierarchy) {
    return userPermissions.some(perm =>
      PERMISSION_HIERARCHIES[perm]?.level >= hierarchy.level
    );
  }
  
  return false;
}
```

### 9. Smart Team Management

```sql
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  team_name VARCHAR(255) NOT NULL,
  manager_id UUID REFERENCES users(id),
  
  department VARCHAR(100),
  description TEXT,
  
  permissions JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, team_name)
);

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  role_in_team VARCHAR(50), -- 'member', 'lead', 'manager'
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(team_id, user_id)
);
```

### 10. Performance Optimization & Caching

```javascript
// lib/cache/cacheStrategy.js
import Redis from 'ioredis';

export class CacheManager {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async getCached(key, fetchFn, ttl = 3600) {
    // Try cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch data
    const data = await fetchFn();
    
    // Cache result
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }
  
  async invalidate(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Caching strategies
// - Dashboard data: 5 minutes
// - Reports: 1 hour
// - Analytics: 24 hours
// - Reference data: 7 days
```

### 11. Email Verification & Security

```javascript
// lib/auth/emailVerification.js
import { generateOTP, sendOTPEmail } from '@/lib/email';

export async function requestEmailVerification(user) {
  const otp = generateOTP(6);
  
  // Store OTP with expiry (10 minutes)
  await redisClient.setex(
    `email_verification:${user.id}`,
    600,
    otp
  );
  
  // Send email
  await sendOTPEmail(user.email, otp, user.first_name);
  
  return {
    success: true,
    message: 'OTP sent to email',
  };
}

export async function verifyEmailOTP(userId, otp) {
  const storedOTP = await redisClient.get(`email_verification:${userId}`);
  
  if (!storedOTP || storedOTP !== otp) {
    return { success: false, error: 'Invalid or expired OTP' };
  }
  
  // Mark email as verified
  await supabase
    .from('users')
    .update({
      email_verified: true,
      email_verified_at: new Date().toISOString(),
    })
    .eq('id', userId);
  
  // Cleanup
  await redisClient.del(`email_verification:${userId}`);
  
  return { success: true };
}
```

### 12. API Rate Limiting

```javascript
// middleware/rateLimiting.js
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Don't rate limit super admins
    return req.admin && req.admin.role === 'super_admin';
  },
  keyGenerator: (req) => {
    // Use tenant + user instead of IP
    return `${req.tenant.id}:${req.user.id}`;
  },
});

// Stricter limits for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.body.email,
});
```

---

## 10. TECHNICAL IMPLEMENTATION STACK

### Recommended Tech Stack

```
Frontend:
  • Framework: Next.js 14+ (App Router)
  • State Management: Zustand + React Query
  • UI Components: Shadcn/ui + Tailwind CSS
  • Forms: React Hook Form + Zod validation
  • Charts: Recharts, Chart.js
  • Real-time: Supabase Realtime, Socket.io

Backend:
  • Runtime: Node.js 20+
  • Framework: Next.js API routes + Express (optional)
  • Database: PostgreSQL (Supabase)
  • Cache: Redis
  • Search: Elasticsearch (optional, for large datasets)
  • Queue: Bull (for background jobs)
  • Auth: Passport.js + JWT

DevOps & Infrastructure:
  • Hosting: Vercel (Frontend) + Docker (Backend)
  • Database: Supabase PostgreSQL
  • Storage: Supabase Storage (S3-compatible)
  • CDN: Cloudflare
  • Monitoring: Sentry + DataDog
  • Logging: ELK Stack or LogRocket

AI & Automation:
  • LLM: Claude API (Anthropic)
  • Workflow: n8n
  • Email/SMS: SendGrid, Twilio
  • WhatsApp: WAHA or Official API

Payment & Fintech:
  • Payment Gateway: Razorpay, Stripe, PayU
  • Compliance: GST Compliance via existing APIs
```

### Performance Targets

```
API Response Times:
  • Dashboard: < 200ms
  • List views: < 500ms
  • Search: < 1s
  • Reports: < 3s

Database:
  • Query execution: < 100ms (95th percentile)
  • Connection pool: 50-100 connections
  • Replication: <1s lag

Frontend:
  • First contentful paint (FCP): < 1.5s
  • Largest contentful paint (LCP): < 2.5s
  • Cumulative layout shift (CLS): < 0.1
  • Lighthouse Score: > 90
```

---

## 11. DEPLOYMENT & INFRASTRUCTURE

### Environment Configuration

```env
# Production
NEXT_PUBLIC_TENANT_DOMAIN=payaid.store
NEXT_PUBLIC_API_URL=https://api.payaid.store

# Database
DATABASE_URL=postgresql://user:password@host:5432/payaid_v3
DIRECT_URL=postgresql://user:password@host:5432/payaid_v3

# Authentication
JWT_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret

# External Services
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

REDIS_URL=redis://host:6379

# Email & Communication
SENDGRID_API_KEY=your_api_key
TWILIO_AUTH_TOKEN=your_token

# Payment
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_secret

# AI Services
ANTHROPIC_API_KEY=your_api_key

# Monitoring
SENTRY_DSN=your_dsn
DATADOG_API_KEY=your_api_key

# Environment
NODE_ENV=production
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Expose
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s CMD curl -f http://localhost:3000/health

# Run
CMD ["npm", "start"]
```

---

## 12. API ARCHITECTURE

### API Endpoints Structure

```
/api/v1/auth/
  POST   /login
  POST   /logout
  POST   /refresh
  POST   /register
  POST   /verify-email
  POST   /forgot-password

/api/v1/tenants/
  GET    / (list all)
  POST   / (create)
  GET    /:id
  PUT    /:id (update)
  DELETE /:id

/api/v1/users/
  GET    / (in tenant)
  POST   /
  GET    /:id
  PUT    /:id
  DELETE /:id
  PUT    /:id/roles (assign roles)

/api/v1/modules/
  GET    / (get accessible modules)
  POST   /:id/enable
  DELETE /:id/disable

/api/v1/crm/
  GET    /leads
  POST   /leads
  GET    /leads/:id
  PUT    /leads/:id
  DELETE /leads/:id
  (Similar for deals, customers, activities)

/api/v1/hr/
  GET    /employees
  POST   /employees
  (Similar structure)

/api/v1/accounting/
  GET    /invoices
  POST   /invoices
  (Similar structure)

/api/v1/admin/ (Super Admin Only)
  GET    /tenants
  POST   /tenants
  PUT    /tenants/:id/modules
  POST   /tenants/:id/users
  DELETE /tenants/:id/users/:userId
```

---

## IMPLEMENTATION ROADMAP

### Phase 1 (Weeks 1-2): Core Infrastructure
- [x] Multi-tenant database schema
- [ ] Tenant context resolution
- [ ] JWT authentication
- [ ] Basic RBAC system
- [ ] RLS policies

### Phase 2 (Weeks 3-4): Module Framework
- [ ] Module registry
- [ ] Navigation system
- [ ] Permission checking
- [ ] Module switching
- [ ] Admin panel structure

### Phase 3 (Weeks 5-6): SSO Implementation
- [ ] Email/Password auth
- [ ] SAML integration
- [ ] OAuth2 integration
- [ ] MFA support
- [ ] Session management

### Phase 4 (Weeks 7-8): Advanced Features
- [ ] Audit logging
- [ ] Advanced analytics
- [ ] Workflow automation
- [ ] Real-time collaboration
- [ ] Performance optimization

### Phase 5 (Weeks 9+): Enhancements & Polish
- [ ] AI-powered insights
- [ ] Advanced reporting
- [ ] Multi-currency support
- [ ] Compliance features
- [ ] Production hardening

---

## COMPETITIVE ADVANTAGES

Your PayAid V3 will outcompete by:

1. **Unified Platform** - CRM + HR + Accounting + Payments in ONE
   - Competitors: Separate solutions (Zoho, SAP, etc.)
   
2. **AI-Powered** - Built-in AI recommendations, automation, insights
   - Competitors: Manual processes or expensive AI add-ons

3. **Indian-First** - GST, ITR compliance, Razorpay integration out of box
   - Competitors: Global-first, India as afterthought

4. **White-Label Ready** - Multi-tenant, customizable, white-label option
   - Competitors: Single-tenant or expensive white-label

5. **Open Automation** - n8n integration, workflow builder
   - Competitors: Closed ecosystems

6. **Cost-Effective** - Free tier, usage-based pricing, no setup fees
   - Competitors: High entry costs

7. **Real-Time Collaboration** - Built-in real-time sync, notifications
   - Competitors: Async-only or expensive add-on

8. **Security-First** - RLS, tenant isolation, compliance by default
   - Competitors: Security add-on

---

## KEY METRICS TO TRACK

```javascript
// Monitor these metrics monthly
{
  "user_metrics": {
    "mau": "Monthly Active Users",
    "churn_rate": "% of users leaving",
    "activation_rate": "% completing onboarding"
  },
  "product_metrics": {
    "module_adoption": "% using each module",
    "feature_usage": "Most/least used features",
    "session_duration": "Average time spent"
  },
  "financial_metrics": {
    "mrr": "Monthly Recurring Revenue",
    "arpu": "Average Revenue Per User",
    "cac": "Customer Acquisition Cost"
  },
  "technical_metrics": {
    "uptime": "System availability %",
    "api_latency": "Response times",
    "error_rate": "% of failed requests"
  }
}
```

---

This comprehensive document covers everything needed to build a world-class multi-tenant SaaS platform. Share it with Cursor and you're ready to start implementation!

**Next Steps:**
1. Review and validate against your requirements
2. Create feature tickets based on implementation roadmap
3. Set up development environment with provided stack
4. Start with Phase 1 core infrastructure
5. Iterate based on feedback

**Questions? Refine any section and we can expand further.**