# Environment Variables Setup Guide

## 🔐 Required Environment Variables for Cybersecurity Implementation

### 1. Encryption Key (CRITICAL)

**Variable:** `ENCRYPTION_KEY`  
**Type:** String (64 hex characters)  
**Purpose:** Used for AES-256-GCM encryption of sensitive data (bank accounts, etc.)

**How to Generate:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using PowerShell (Windows)
[System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**Example:**
```
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**⚠️ Important:**
- Must be exactly 64 hex characters (32 bytes)
- Store securely - never commit to git
- Rotate quarterly (see encryption service for key rotation)

---

### 2. Upstash Redis (Rate Limiting)

**Variables:**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**Purpose:** Used for distributed rate limiting across all instances

**How to Get:**
1. Sign up at [https://upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the REST URL and Token from the dashboard

**Example:**
```
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

**⚠️ Important:**
- Use REST API (not direct connection) for serverless compatibility
- Free tier: 10,000 commands/day
- Production: Consider paid tier for higher limits

---

### 3. Sentry (Error Tracking) - Optional but Recommended

**Variables:**
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN` (same value)

**Purpose:** Error tracking and monitoring

**How to Get:**
1. Sign up at [https://sentry.io](https://sentry.io)
2. Create a new project (Next.js)
3. Copy the DSN

**Example:**
```
SENTRY_DSN=https://your-key@sentry.io/your-project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
```

---

### 4. Payment Gateway (PayAid Payments) - For Payment Security

**Note:** All payments are processed exclusively through PayAid Payments. No third-party payment gateways (like Razorpay) are used.

**Purpose:** PCI-compliant payment processing via PayAid Payments

**Configuration:**
- PayAid Payments is integrated directly into the platform
- No additional environment variables required for payment processing
- Payment API credentials are managed through PayAid Payments dashboard

---

## 📋 Complete Environment Variables List

### Production (.env.production or Vercel Environment Variables)

```bash
# Encryption (REQUIRED)
ENCRYPTION_KEY=<64-hex-characters>

# Rate Limiting (REQUIRED)
UPSTASH_REDIS_REST_URL=<your-upstash-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>

# Error Tracking (RECOMMENDED)
SENTRY_DSN=<your-sentry-dsn>
NEXT_PUBLIC_SENTRY_DSN=<your-sentry-dsn>

# Payment Gateway (PayAid Payments)
# All payments processed through PayAid Payments only
# No additional environment variables required

# Database (Already configured)
DATABASE_URL=<your-database-url>

# JWT (Already configured)
JWT_SECRET=<your-jwt-secret>
NEXTAUTH_SECRET=<your-nextauth-secret>
```

---

## 🚀 Setting Up in Vercel

1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Add each variable:
   - **Key:** Variable name (e.g., `ENCRYPTION_KEY`)
   - **Value:** Variable value
   - **Environment:** Select `Production`, `Preview`, and/or `Development`
3. Click **Save**
4. **Redeploy** your application for changes to take effect

---

## ✅ Verification

After setting up environment variables, verify they're loaded:

```typescript
// Check in your code
console.log('ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? '✅ Set' : '❌ Missing')
console.log('UPSTASH_REDIS_REST_URL:', process.env.UPSTASH_REDIS_REST_URL ? '✅ Set' : '❌ Missing')
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use different keys for dev/staging/production**
3. **Rotate encryption keys quarterly**
4. **Use Vercel's environment variable encryption**
5. **Limit access to environment variables** (only admins)

---

**Last Updated:** December 31, 2025

