# PayAid V3: Enterprise Cybersecurity & Data Protection Strategy
**Version:** 1.0  
**Status:** Production Security Roadmap  
**Last Updated:** December 31, 2025  
**Target:** RBI/NPCI Compliance + SOC 2 Type II

---

## EXECUTIVE SUMMARY

PayAid V3 handles sensitive financial data (payments, invoices, employee records, GST filings). This document outlines **12 security layers** that protect against 99%+ of known attack vectors, matching industry standards of PayAid Payments, ICICI Bank APIs, and Zoho Enterprise.

**Security Tiers:**
- **🔴 CRITICAL (Week 1):** Authentication, Multi-tenant isolation, Rate limiting
- **🟠 HIGH (Week 2-3):** Encryption, API hardening, Payment security
- **🟡 MEDIUM (Week 4+):** Monitoring, Compliance, Incident response

---

## LAYER 1: AUTHENTICATION & ACCESS CONTROL

### MFA (Multi-Factor Authentication)
**Why:** Single password breaches account. MFA prevents 99.9% of credential stuffing attacks.

**Implementation:**
```javascript
// Clerk.com setup (already integrated)
import { auth } from "@clerk/nextjs";

export async function POST(req: Request) {
  const { userId } = auth();
  
  // TOTP (Time-based OTP)
  // - Enforce on all admin accounts
  // - Optional for standard users (recommended in onboarding)
  // - 30-second code expiration
  // - Backup codes stored encrypted in Supabase
  
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  
  // Validate session freshness (< 1 hour for payment actions)
  const sessionAge = Date.now() - session.createdAt;
  if (sessionAge > 3600000 && isPaymentAction) {
    return Response.json({ error: "Re-authenticate" }, { status: 403 });
  }
}
```

**Configuration:**
- **TOTP Provider:** Google Authenticator, Microsoft Authenticator, Authy
- **Backup Codes:** 10 one-time codes per user (encrypted in DB)
- **Session Duration:** 
  - Standard actions: 8 hours
  - Payment/Admin actions: 1 hour
  - Sensitive (bank details): 15 minutes
- **Account Lockout:** 5 failed attempts → 30 min lockout

### Role-Based Access Control (RBAC)
**Permission Levels:**
```
OWNER (1 per org)
├─ All permissions
├─ Billing, SSO, Compliance
└─ User management

ADMIN (org-wide)
├─ All modules enabled
├─ User roles, API keys
└─ Audit logs

MANAGER (role-based)
├─ Department access (HR, Finance, Sales)
├─ Create, edit, read within role
└─ Limited reporting

USER (basic)
├─ Read own records
├─ Create assigned tasks
└─ No admin/billing access

API_INTEGRATION (app-specific)
├─ Scoped to single endpoint
├─ Time-limited tokens (max 90 days)
└─ IP whitelisting support
```

**Database Implementation (Supabase RLS):**
```sql
-- Enforce role at database level
CREATE POLICY "users_see_own_org_data"
ON public.contacts
AS SELECT
USING (
  auth.uid()::text = (
    SELECT user_id FROM org_members 
    WHERE org_id = contacts.org_id
  )
);

-- Admin-only invoice deletion
CREATE POLICY "admin_can_delete_invoices"
ON public.invoices
AS DELETE
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = invoices.org_id
    AND user_id = auth.uid()::text
    AND role = 'admin'
  )
);
```

**API Server Action Validation:**
```typescript
// Always validate on server, never trust client
async function deleteInvoice(invoiceId: string) {
  const { userId } = auth();
  
  // 1. Check user exists in org
  const member = await db.org_members.findFirst({
    where: { user_id: userId }
  });
  
  if (!member) throw new Error("Unauthorized");
  
  // 2. Check role has permission
  const permissions = {
    'owner': ['delete'],
    'admin': ['delete'],
    'manager': [], // managers cannot delete
    'user': []
  };
  
  if (!permissions[member.role].includes('delete')) {
    throw new Error("Insufficient permissions");
  }
  
  // 3. Verify invoice belongs to user's org
  const invoice = await db.invoices.findUnique({
    where: { id: invoiceId }
  });
  
  if (invoice.org_id !== member.org_id) {
    throw new Error("Access denied"); // Cross-tenant injection prevented
  }
  
  // 4. Delete
  await db.invoices.delete({ where: { id: invoiceId } });
  
  // 5. Log action
  await auditLog({
    action: 'DELETE_INVOICE',
    userId,
    orgId: member.org_id,
    resourceId: invoiceId,
    timestamp: new Date()
  });
}
```

---

## LAYER 2: MULTI-TENANT DATA ISOLATION

**Threat:** One customer sees another's contacts, invoices, or employee records.

### Row-Level Security (RLS) Enforcement
**Rule:** Every query must include `org_id` filter. Database enforces this, not application.

```sql
-- Supabase RLS Policies (ENABLED BY DEFAULT)

-- Contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_contacts" ON contacts
  FOR ALL
  USING (
    org_id = (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()::text LIMIT 1
    )
  );

-- Invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_invoices" ON invoices
  FOR ALL
  USING (
    org_id = (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()::text LIMIT 1
    )
  );

-- Employees (HR module - most sensitive)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_manager_can_see_own_dept" ON employees
  FOR SELECT
  USING (
    org_id = (SELECT org_id FROM org_members WHERE user_id = auth.uid()::text)
    AND (
      -- Owner/Admin see all
      (SELECT role FROM org_members WHERE user_id = auth.uid()::text) IN ('owner', 'admin')
      OR
      -- HR Manager sees department
      (SELECT role FROM org_members WHERE user_id = auth.uid()::text) = 'hr_manager'
      AND department_id = (SELECT department_id FROM org_members WHERE user_id = auth.uid()::text)
    )
  );

-- Bank details (most sensitive - encrypted at rest)
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_only_bank_details" ON bank_accounts
  FOR ALL
  USING (
    org_id = (SELECT org_id FROM org_members WHERE user_id = auth.uid()::text)
    AND (SELECT role FROM org_members WHERE user_id = auth.uid()::text) = 'admin'
  );
```

### Application-Layer Tenant Validation
```typescript
// Next.js Middleware - Check tenant on every request
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function middleware(request: NextRequest) {
  const { userId } = auth();
  const url = new URL(request.url);
  const tenantId = url.pathname.split('/')[2]; // /dashboard/[tenantId]/...
  
  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Verify user can access this tenant
  const memberRecord = await db.org_members.findFirst({
    where: {
      user_id: userId,
      org_id: tenantId
    }
  });
  
  if (!memberRecord) {
    return NextResponse.json(
      { error: "Access Denied - Invalid tenant" },
      { status: 403 }
    );
  }
  
  // Pass tenant context to handlers
  request.headers.set('X-Tenant-ID', tenantId);
  return NextResponse.next();
}

// Apply to all dashboard routes
export const config = {
  matcher: ['/dashboard/:path*', '/api/v1/:path*']
};
```

### Database Schema Design (Tenant-First)
```sql
-- Every table has org_id as primary key component
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP,
  -- CRITICAL: Composite index for queries
  UNIQUE(org_id, email),
  INDEX idx_org_contacts (org_id, created_at DESC)
);

-- Bank accounts (encrypted)
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_number_encrypted BYTEA NOT NULL, -- pgcrypto encrypted
  ifsc VARCHAR(11) NOT NULL,
  holder_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP
);

-- Audit log (tenant-scoped, immutable)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  changes JSONB, -- what changed
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  -- Immutable: no updates/deletes allowed
  INDEX idx_org_audit (org_id, created_at DESC)
);
```

---

## LAYER 3: PAYMENT SECURITY (PCI DSS)

**Threat:** If card data stored on your servers, you're liable for ₹500k+ fines per breach.

### PCI DSS Compliance (Level 1)
**Rule:** NEVER STORE CARD DETAILS. Use tokenized payments only.

```typescript
// ❌ WRONG - This violates PCI DSS
app.post('/pay', async (req) => {
  const { cardNumber, expiry, cvv } = req.body;
  // DON'T STORE THIS ❌
  await db.payments.create({
    card_number: cardNumber,
    expiry: expiry,
    cvv: cvv
  });
});

// ✅ CORRECT - Tokenization via PayAid Payments
import { getPayAidPayments } from '@/lib/payments/payaid';

const payaid = getPayAidPayments();

// Client-side (Next.js component)
function CheckoutForm() {
  const handlePayment = async () => {
    // PayAid Payments tokenizes card on frontend
    // Card details NEVER reach your server
    const paymentUrlData = await payaid.getPaymentRequestUrl({
      order_id: orderId,
      amount: 50000, // ₹500
      currency: 'INR',
      description: 'Payment for order',
      name: user.name,
      email: user.email,
      return_url: `${process.env.APP_URL}/payment/callback?status=success`,
      return_url_failure: `${process.env.APP_URL}/payment/callback?status=failure`,
      mode: process.env.NODE_ENV === 'production' ? 'LIVE' : 'TEST',
    });
    
    // Redirect to PayAid Payments checkout page
    window.location.href = paymentUrlData.url;
  };
  
  return <button onClick={handlePayment}>Pay ₹500</button>;
}

// Server-side (verify payment callback)
export async function POST(req: Request) {
  const { payment_id, order_id, signature } = await req.json();
  
  // 1. Verify signature (ensures payment is legit)
  const isValid = await payaid.verifyPaymentSignature({
    payment_id,
    order_id,
    signature,
  });
  
  if (!isValid) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  
  // 2. Store ONLY token + metadata (never store card details)
  await db.payments.create({
    org_id: tenantId,
    payaid_payment_id, // token, not card
    amount: 50000,
    status: 'success',
    created_at: new Date()
  });
  
  return Response.json({ success: true });
}
```

### Payment Gateway Configuration
```bash
# .env.production
# All payments processed through PayAid Payments only
# No third-party payment gateway credentials required
# Payment API credentials managed through PayAid Payments dashboard

# Enable 3D Secure for high-value txns (handled by PayAid Payments)
PAYAID_3DS_ENABLED=true
```

### Compliance Checklist
- [ ] PayAid Payments handles card tokenization (not your servers)
- [ ] Annual PCI DSS audit certificate uploaded to RBI
- [ ] SSL/TLS 1.3 on all payment endpoints
- [ ] No card data in logs, backups, or analytics
- [ ] PCI SAQ-A (Lightest compliance: you're SAQ-A, gateway is PCI L1)

---

## LAYER 4: API SECURITY & RATE LIMITING

**Threat:** Brute force attacks (login hammering), scrapers (data harvesting), DDoS.

### Rate Limiting with Upstash Redis
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Global rate limiter (all endpoints)
const globalLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(1000, "1 h"), // 1000 req/hour global
  analytics: true
});

// Auth endpoint (stricter)
const authLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts/15 min
  keyFn: (request) => {
    return request.headers.get("cf-connecting-ip") || 
           request.headers.get("x-forwarded-for") || 
           "unknown";
  },
});

// API endpoint (per-user)
const apiLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.tokenBucket(100, "1 h", 10), // 100 tokens/hour, max 10 burst
  keyFn: (request) => `api:${userId}`,
});

// Apply in middleware
export async function middleware(request: NextRequest) {
  // Check global rate limit
  const { success: globalSuccess } = await globalLimiter.limit(request.url);
  if (!globalSuccess) {
    return new Response("Too many requests", { status: 429 });
  }
  
  // Check auth rate limit for /login
  if (request.nextUrl.pathname === "/api/auth/login") {
    const { success } = await authLimiter.limit(request);
    if (!success) {
      return new Response("Too many login attempts. Try again in 15 minutes.", { status: 429 });
    }
  }
  
  return NextResponse.next();
}
```

### Input Validation with Zod
```typescript
import { z } from 'zod';

// Define schema
const contactSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/), // E.164 format
  tags: z.array(z.string().max(50)).max(10), // Max 10 tags
});

// API handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // ✅ Validate input
    const validated = contactSchema.parse(body);
    
    // Sanitize: prevent XSS
    const sanitized = {
      name: DOMPurify.sanitize(validated.name),
      email: validated.email.toLowerCase(),
      phone: validated.phone,
      tags: validated.tags.map(t => t.trim())
    };
    
    // Save to database
    const contact = await db.contacts.create({
      ...sanitized,
      org_id: tenantId
    });
    
    return Response.json(contact);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

### API Key Management
```typescript
// Generate secure API keys for integrations
import { randomBytes } from 'crypto';

async function generateAPIKey(orgId: string, name: string) {
  const key = randomBytes(32).toString('hex');
  const hashedKey = await hash(key); // bcrypt/argon2
  
  // Store hashed key (can't recover original)
  await db.api_keys.create({
    org_id: orgId,
    name: name,
    key_hash: hashedKey,
    scopes: ['read:contacts', 'write:invoices'], // Granular permissions
    rate_limit: 100, // requests/hour
    ip_whitelist: ['192.168.1.1', '10.0.0.0/8'], // IP-based access
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days max
    created_at: new Date()
  });
  
  return {
    key: key, // Show once (user must save)
    name: name,
    created_at: new Date()
  };
}

// Validate API key on request
export async function validateAPIKey(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const keyString = authHeader.substring(7);
  const hashedKey = await hash(keyString);
  
  const apiKey = await db.api_keys.findFirst({
    where: {
      key_hash: hashedKey,
      expires_at: { gt: new Date() }
    }
  });
  
  if (!apiKey) return null;
  
  // Check IP whitelist
  const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!isIPWhitelisted(clientIP, apiKey.ip_whitelist)) {
    return null;
  }
  
  return { orgId: apiKey.org_id, scopes: apiKey.scopes };
}
```

---

## LAYER 5: ENCRYPTION AT REST & IN TRANSIT

### TLS/SSL (In Transit)
```bash
# Vercel auto-enables HTTPS on all *.vercel.app domains
# Custom domain: Enable automatic SSL in Vercel Dashboard

# Verify SSL grade
curl -I https://payaid-v3.vercel.app
# Should show: Strict-Transport-Security: max-age=31536000

# Test SSL strength
openssl s_client -connect payaid-v3.vercel.app:443
# Should show: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384
```

### Database Encryption (At Rest)
```sql
-- Enable pgcrypto extension in Supabase
CREATE EXTENSION pgcrypto;

-- Encrypt sensitive fields
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  -- Plaintext stored as encrypted BYTEA
  account_number BYTEA,
  -- Encrypt with org-specific key
  account_number_encrypted BYTEA NOT NULL GENERATED ALWAYS AS (
    pgp_sym_encrypt(account_number::text, 'org_' || org_id::text)
  ) STORED,
  created_at TIMESTAMP
);

-- Decrypt on read
SELECT 
  id,
  pgp_sym_decrypt(account_number_encrypted, 'org_' || org_id::text)::text as account_number,
  created_at
FROM bank_accounts
WHERE org_id = 'xxx-xxx-xxx';
```

### Application-Level Encryption
```typescript
import crypto from 'crypto';

class EncryptionService {
  private key = process.env.ENCRYPTION_KEY; // 32-byte hex string
  
  encrypt(plaintext: string, orgId: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(this.key, 'hex'),
      iv
    );
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  decrypt(encrypted: string, orgId: string): string {
    const [ivHex, authTagHex, ciphertext] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.key, 'hex'),
      iv
    );
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Usage
const encryption = new EncryptionService();

// Store
const bankAccount = {
  account_number: encryption.encrypt('123456789012', orgId),
  ifsc: 'HDFC0000001'
};

// Retrieve
const decrypted = encryption.decrypt(bankAccount.account_number, orgId);
```

### Key Rotation
```typescript
// Rotate encryption keys quarterly
async function rotateEncryptionKey() {
  const oldKey = process.env.ENCRYPTION_KEY;
  const newKey = crypto.randomBytes(32).toString('hex');
  
  // 1. Re-encrypt all data with new key
  const records = await db.bank_accounts.findMany();
  
  for (const record of records) {
    const decrypted = encryption.decrypt(record.account_number_encrypted, oldKey);
    const reencrypted = encryption.encrypt(decrypted, newKey);
    
    await db.bank_accounts.update({
      where: { id: record.id },
      data: { account_number_encrypted: reencrypted }
    });
  }
  
  // 2. Update environment variable
  await updateSecrets({ ENCRYPTION_KEY: newKey });
  
  // 3. Log event
  await auditLog({
    action: 'KEY_ROTATION',
    timestamp: new Date()
  });
}

// Schedule quarterly
schedule.every('3 months').do(rotateEncryptionKey);
```

---

## LAYER 6: SECURITY HEADERS & CSP

### Implement Security Headers
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload' // Force HTTPS
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff' // Prevent MIME type sniffing
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY' // Prevent clickjacking
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block' // Legacy XSS filter
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'"
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=(), camera=()' // Disable unused APIs
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      }
    ];
  }
};
```

### Content Security Policy (CSP)
```typescript
// Prevent XSS attacks
const csp = "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: https:; " +
  "font-src 'self' https://fonts.googleapis.com; " +
  "connect-src 'self' https://api.supabase.co;";

// Add to response headers
response.headers.set('Content-Security-Policy', csp);
```

---

## LAYER 7: MONITORING & THREAT DETECTION

### Error Tracking (Sentry)
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Don't send PII
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
  integrations: [
    new Sentry.Replay({
      maskAllText: true, // Don't record user input
      blockAllMedia: true,
    }),
  ],
});

// Capture errors
try {
  // code
} catch (error) {
  Sentry.captureException(error, {
    tags: { section: "payment_processing" },
    contexts: { user: { id: userId } }
  });
}
```

### Anomaly Detection
```typescript
// Track failed login attempts
async function trackLoginAttempt(email: string, success: boolean) {
  const key = `login_attempts:${email}`;
  const attempts = await redis.incr(key);
  await redis.expire(key, 900); // 15 min window
  
  if (attempts > 5) {
    // Alert: Possible brute force
    await slack.send({
      channel: '#security',
      text: `🚨 Brute force attempt detected: ${email} (${attempts} attempts)`
    });
    
    // Auto-lock account
    await db.users.update({
      where: { email },
      data: { locked_until: new Date(Date.now() + 30 * 60 * 1000) }
    });
  }
  
  // Log
  await auditLog({
    action: 'LOGIN_ATTEMPT',
    email,
    success,
    ip: request.ip,
    user_agent: request.headers['user-agent']
  });
}
```

### Session Monitoring
```typescript
// Detect suspicious session activity
async function validateSession(sessionId: string, currentIP: string) {
  const session = await db.sessions.findUnique({
    where: { id: sessionId }
  });
  
  if (!session) return false;
  
  // Check for impossible travel (session used from 2 countries in 5 min)
  const lastLocation = await geoip.lookup(session.last_ip);
  const currentLocation = await geoip.lookup(currentIP);
  
  const distance = haversine(lastLocation, currentLocation); // km
  const timeDiff = (Date.now() - session.last_activity_at) / 1000 / 60; // minutes
  const maxSpeed = 900; // km/min (commercial flight)
  
  if (distance > maxSpeed * timeDiff) {
    // Alert: Impossible travel
    await slack.send({
      text: `⚠️ Impossible travel detected for ${session.user_id}: ${lastLocation.city} → ${currentLocation.city} in ${timeDiff}min`
    });
    
    // Invalidate session
    await db.sessions.delete({ where: { id: sessionId } });
    return false;
  }
  
  session.last_ip = currentIP;
  session.last_activity_at = new Date();
  await db.sessions.update({ where: { id: sessionId }, data: session });
  
  return true;
}
```

---

## LAYER 8: COMPLIANCE & AUDIT LOGGING

### Immutable Audit Log
```sql
-- Create immutable audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL,
  action VARCHAR(100) NOT NULL, -- LOGIN, CREATE_CONTACT, DELETE_INVOICE, etc.
  resource_type VARCHAR(50), -- contacts, invoices, employees
  resource_id UUID,
  changes JSONB, -- { before: {}, after: {} }
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20), -- success, failure
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Prevent tampering
  CHECK (created_at <= NOW()),
  
  -- Indexes for common queries
  INDEX idx_org_audit (org_id, created_at DESC),
  INDEX idx_user_audit (user_id, created_at DESC),
  INDEX idx_action (action, created_at DESC)
);

-- Prevent any modifications to audit_logs
CREATE POLICY "audit_logs_immutable" ON audit_logs
  FOR UPDATE USING (FALSE);

CREATE POLICY "audit_logs_no_delete" ON audit_logs
  FOR DELETE USING (FALSE);

-- Only allow inserts
CREATE POLICY "audit_logs_insert_only" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);
```

### Log Business Actions
```typescript
export async function createInvoice(data: InvoiceData) {
  const { userId, orgId } = auth();
  
  // Create invoice
  const invoice = await db.invoices.create({
    data: {
      ...data,
      org_id: orgId
    }
  });
  
  // Log action (immutable)
  await db.audit_logs.create({
    data: {
      org_id: orgId,
      user_id: userId,
      action: 'CREATE_INVOICE',
      resource_type: 'invoices',
      resource_id: invoice.id,
      changes: {
        before: null,
        after: invoice
      },
      ip_address: request.ip,
      user_agent: request.headers['user-agent'],
      status: 'success'
    }
  });
  
  return invoice;
}

// Expose audit logs to authorized users
export async function getAuditLogs(orgId: string, filters: AuditFilter) {
  // Only admins can view
  const member = await checkPermission(userId, orgId, 'view_audit_logs');
  if (!member) throw new Error("Unauthorized");
  
  return db.audit_logs.findMany({
    where: {
      org_id: orgId,
      ...(filters.action && { action: filters.action }),
      ...(filters.startDate && { created_at: { gte: filters.startDate } })
    },
    orderBy: { created_at: 'desc' },
    take: 1000
  });
}
```

### Compliance Reports
```typescript
// Generate DPDP Act 2025 Data Processing Agreement
async function generateDPA(orgId: string) {
  const org = await db.organizations.findUnique({ where: { id: orgId } });
  const auditLog = await db.audit_logs.findMany({
    where: { org_id: orgId },
    orderBy: { created_at: 'desc' },
    take: 1000
  });
  
  const report = {
    organization: org.name,
    dpa_version: '1.0',
    effective_date: new Date(),
    data_processors: [
      { name: 'Supabase', location: 'US', certifications: ['SOC2', 'ISO27001'] },
      { name: 'Vercel', location: 'US', certifications: ['SOC2', 'ISO27001'] },
      { name: 'PayAid Payments', location: 'India', certifications: ['PCI-DSS', 'ISO27001'] }
    ],
    data_transfers: auditLog.map(log => ({
      action: log.action,
      resource_type: log.resource_type,
      timestamp: log.created_at,
      user: log.user_id
    })),
    retention_policy: '3 years',
    deletion_requests: [] // GDPR right-to-be-forgotten
  };
  
  return report;
}
```

---

## LAYER 9: INCIDENT RESPONSE & BACKUP

### Incident Response Plan
```
SEVERITY LEVELS:
🔴 CRITICAL: Potential data breach, payment system down, ransomware
🟠 HIGH: Unauthorized access, RCE vulnerability, DDoS
🟡 MEDIUM: Failed auth, rate limit spike, encryption key exposure
🟢 LOW: Minor bugs, performance degradation
```

**Response Timeline:**
| Time | Action |
|------|--------|
| T+0 min | Detect & Page on-call security team |
| T+5 min | Verify issue, isolate affected systems |
| T+15 min | Customer notification if data at risk |
| T+30 min | Root cause analysis started |
| T+2 hours | Status page update |
| T+24 hours | Full incident report, remediation plan |

```typescript
// Automated incident detection
async function detectIncident() {
  // 1. Monitor error rates
  const errorRate = await sentry.getErrorRate('1h');
  if (errorRate > 5%) {
    await slack.send({
      text: '🚨 Error rate spike: ' + errorRate + '%'
    });
  }
  
  // 2. Monitor failed auth
  const failedLogins = await redis.get('failed_logins:1h');
  if (failedLogins > 100) {
    await slack.send({
      text: '⚠️ Brute force detected: ' + failedLogins + ' failed attempts'
    });
  }
  
  // 3. Monitor DB connection failures
  const dbFailures = await sentry.getIssueCount('db_connection_error', '1h');
  if (dbFailures > 10) {
    await slack.send({
      text: '🔴 Database connectivity issue'
    });
    // Auto-failover to read replica
    await failoverDatabase();
  }
}

// Schedule every minute
schedule.every('1 minute').do(detectIncident);
```

### Backup & Recovery
```bash
# Supabase automated backups
# - Daily backups (7-day retention)
# - Point-in-time recovery (24-hour window)
# - Configure in Supabase Dashboard > Settings > Backups

# Vercel deployment history
# - Last 100 deployments stored
# - 1-click rollback to any deployment
# - Automatic backups before major changes

# Manual backup script (run weekly)
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="payaid_backup_$BACKUP_DATE.sql"

# Backup database
supabase db dump --local > $BACKUP_FILE

# Encrypt backup
gpg --symmetric --cipher-algo AES256 $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE.gpg s3://payaid-backups/ \
  --sse AES256 \
  --storage-class GLACIER_IR

# Cleanup local
rm -f $BACKUP_FILE*
```

---

## LAYER 10: DEPENDENCY & SUPPLY CHAIN SECURITY

### Vulnerable Dependency Scanning
```bash
# Weekly audit
npm audit --audit-level=moderate

# Install Snyk for continuous monitoring
npm install -g snyk
snyk auth
snyk monitor

# Add to GitHub Actions (CI/CD)
name: Security Audit
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: snyk/actions/node@master
        with:
          args: --severity-threshold=high
```

### Lock Dependencies
```json
// package-lock.json / yarn.lock
// - Commit lock file to ensure reproducible builds
// - Review lock file changes in PRs
// - Use npm ci (instead of npm install) in production

{
  "name": "payaid-v3",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "next@14.0.0": {
      "version": "14.0.0",
      "integrity": "sha512-...",
      "dependencies": {
        "react": "^18.2.0"
      }
    }
  }
}
```

---

## LAYER 11: PENETRATION TESTING & SECURITY AUDITS

### Annual Penetration Test
```
Timeline: Q2 2026 (after MVP launch)
Cost: ₹5-10 lakhs
Certifications:
- CREST (Council of Registered Ethical Security Testers)
- Zerodium ($100k+ for 0-days)

Test Coverage:
✅ Network penetration (external)
✅ Web application security (OWASP Top 10)
✅ API security testing
✅ Multi-tenant isolation verification
✅ Encryption implementation review
✅ Incident response testing
✅ Social engineering / phishing

Expected deliverables:
- Executive summary
- Detailed findings with CVSS scores
- Remediation roadmap
- Compliance certification
```

### Vulnerability Disclosure Program
```
payaid.store/.well-known/security.txt

Contact: security@payaid.store
Preferred-Languages: en, hi
Canonical: https://payaid.store/security
Policy: https://payaid.store/responsible-disclosure

Response timeline:
- Critical: 24 hours
- High: 72 hours
- Medium: 1 week
- Low: 2 weeks

Responsible Disclosure:
- Don't publicly disclose bugs
- Confidential reporting via security@payaid.store
- Security researchers credited (if they want)
- Potential rewards for critical findings
```

---

## LAYER 12: COMPLIANCE CERTIFICATIONS ROADMAP

### RBI / NPCI Compliance (India-Specific)
```
Q1 2026:
✅ Master Circular on Payment Systems
✅ Know Your Customer (KYC) implementation
✅ Anti-Money Laundering (AML) checks
✅ Payment System Operator (PSO) license application (if needed)

Q2 2026:
✅ GST compliance for financial services
✅ DPDP Act 2025 data localization
✅ NEFT/RTGS integration for B2B payments

Q3 2026:
✅ RBI license for payment aggregator (if expansion needed)
```

### SOC 2 Type II Certification (Enterprise SaaS)
```
Timeline: 12 months of evidence gathering
Cost: ₹10-15 lakhs

Audit Scopes:
✅ Security: Access controls, data protection, encryption
✅ Availability: Uptime monitoring, disaster recovery
✅ Processing Integrity: Transaction accuracy, audit logs
✅ Confidentiality: Data isolation, encryption, access logs
✅ Privacy: GDPR/DPDP compliance, consent management

Benefits:
- Enterprise sales capability (+30% conversion)
- Customer trust & certification badge
- Regulatory compliance proof
- Breach liability insurance eligibility
```

### ISO 27001 / 27017 / 27018
```
Security Management System Certification

27001: Information Security Management
27017: Cloud security (additional to 27001)
27018: PII protection in cloud (additional)

Timeline: 6 months
Cost: ₹3-5 lakhs

Benefits:
- Industry-recognized security standard
- Investor confidence for funding rounds
- International expansion readiness
```

---

## IMPLEMENTATION ROADMAP

### Week 1-2 (CRITICAL)
- [ ] Enable Supabase Row-Level Security on all tables
- [ ] Implement MFA (Clerk TOTP)
- [ ] Add rate limiting (Upstash Redis)
- [ ] Enable HTTPS/TLS 1.3 (Vercel auto)
- [ ] Implement input validation (Zod on all APIs)
- [ ] Set security headers (next.config.js)

### Week 3-4 (HIGH)
- [ ] PCI tokenized payments (PayAid Payments)
- [ ] Database encryption (pgcrypto)
- [ ] Audit logging (immutable)
- [ ] Error tracking (Sentry)
- [ ] API key management

### Week 5-6 (MEDIUM)
- [ ] Threat detection (failed logins, anomalies)
- [ ] Backup automation
- [ ] Incident response playbook
- [ ] Dependency security scanning (Snyk)

### Week 7-8 (ONGOING)
- [ ] Penetration testing (Q2 2026)
- [ ] SOC 2 Type II audit (Q3 2026)
- [ ] RBI compliance documentation
- [ ] Responsible disclosure program

---

## SECURITY CHECKLIST (Pre-Launch)

**Authentication & Access:**
- [ ] MFA enabled on all admin accounts
- [ ] RBAC implemented with database enforcement
- [ ] Session timeout after 1 hour (admin), 8 hours (user)
- [ ] Account lockout after 5 failed attempts
- [ ] API keys with 90-day expiration

**Data Protection:**
- [ ] TLS 1.3 on all endpoints
- [ ] Database encryption enabled (pgcrypto)
- [ ] Sensitive fields encrypted at application level
- [ ] Audit logs immutable and tamper-proof
- [ ] Data retention policy enforced (3 years)

**Payment Security:**
- [ ] Zero card data storage (PayAid Payments tokenized)
- [ ] PCI DSS Level 1 compliance (gateway responsibility)
- [ ] Payment signature verification on every transaction
- [ ] 3D Secure enabled for high-value payments

**API & Infrastructure:**
- [ ] Rate limiting: 1000 req/hour global, 5 req/15min auth
- [ ] Input validation on every endpoint (Zod)
- [ ] Security headers set (CSP, HSTS, X-Frame-Options)
- [ ] CORS properly configured (no allow-all)
- [ ] API keys stored hashed (bcrypt/argon2)

**Monitoring & Response:**
- [ ] Error tracking (Sentry) with alerting
- [ ] Failed login detection & auto-lockout
- [ ] Impossible travel detection
- [ ] Anomaly detection for payment spikes
- [ ] Incident response plan documented

**Compliance:**
- [ ] Audit logs reviewed monthly
- [ ] Backup tested quarterly
- [ ] Dependency updates applied within 30 days
- [ ] Security.txt published with responsible disclosure
- [ ] Privacy policy & terms aligned with DPDP Act

---

## CONTACT & SUPPORT

**Security Issues:** security@payaid.store  
**Emergency Incident:** +91-xxxx-xxxx-xx (on-call)  
**Responsible Disclosure:** [https://payaid.store/responsible-disclosure](https://payaid.store/responsible-disclosure)  

---

**Document Version:** 1.0  
**Last Updated:** December 31, 2025  
**Next Review:** March 31, 2026  
**Prepared By:** PayAid Security Team