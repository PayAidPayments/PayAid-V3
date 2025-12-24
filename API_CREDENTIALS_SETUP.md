# API Credentials Setup Guide

This document outlines all the API credentials and services you need to obtain to fully configure PayAid V3.

## 🔑 Required API Credentials

### 1. **PayAid Payments** (CRITICAL - Payment Processing)
**Status:** Required for payment processing
- **API Key:** Get from PayAid Payments dashboard
- **API Secret:** Get from PayAid Payments dashboard  
- **Webhook Secret:** Configure webhook endpoint and get secret
- **Base URL:** `https://api.payaidpayments.com` (default)
- **Where to get:** Contact PayAid Payments support or access developer dashboard
- **Environment Variables:**
  ```
  PAYAID_PAYMENTS_API_KEY=""
  PAYAID_PAYMENTS_API_SECRET=""
  PAYAID_PAYMENTS_WEBHOOK_SECRET=""
  PAYAID_PAYMENTS_BASE_URL="https://api.payaidpayments.com"
  ```

### 2. **SendGrid** (Email Service)
**Status:** Required for email sending (invoices, notifications, campaigns)
- **API Key:** Generate from SendGrid dashboard
- **From Email:** Your verified sender email (e.g., `noreply@payaid.com`)
- **Where to get:** 
  1. Sign up at https://sendgrid.com
  2. Verify your sender email
  3. Go to Settings > API Keys > Create API Key
  4. Give it "Full Access" or "Mail Send" permissions
- **Environment Variables:**
  ```
  SENDGRID_API_KEY="SG.xxxxxxxxxxxxx"
  SENDGRID_FROM_EMAIL="noreply@payaid.com"
  ```
- **Free Tier:** 100 emails/day forever

### 3. **WATI** (WhatsApp Business API)
**Status:** Required for WhatsApp marketing and notifications
- **API Key:** Get from WATI dashboard
- **Base URL:** `https://api.wati.io` (default)
- **Where to get:**
  1. Sign up at https://wati.io
  2. Complete business verification
  3. Get API credentials from dashboard
- **Environment Variables:**
  ```
  WATI_API_KEY="your-wati-api-key"
  WATI_BASE_URL="https://api.wati.io"
  ```
- **Pricing:** Starts at ₹999/month for 1000 conversations

### 4. **Exotel** (SMS Service)
**Status:** Required for SMS marketing and notifications
- **API Key:** Get from Exotel dashboard
- **API Token:** Get from Exotel dashboard
- **Subdomain/SID:** Your Exotel subdomain
- **Where to get:**
  1. Sign up at https://exotel.com
  2. Complete KYC verification
  3. Get API credentials from developer dashboard
- **Environment Variables:**
  ```
  EXOTEL_API_KEY="your-exotel-api-key"
  EXOTEL_API_TOKEN="your-exotel-api-token"
  EXOTEL_SID="your-exotel-sid"
  ```
- **Pricing:** Pay-as-you-go (₹0.15-0.50 per SMS)

### 5. **OpenAI** (AI Fallback)
**Status:** Optional - Fallback for AI features if Ollama unavailable
- **API Key:** Get from OpenAI platform
- **Where to get:**
  1. Sign up at https://platform.openai.com
  2. Add payment method
  3. Go to API Keys section and create new key
- **Environment Variables:**
  ```
  OPENAI_API_KEY="sk-xxxxxxxxxxxxx"
  ```
- **Pricing:** Pay-as-you-go (GPT-4: ~$0.03 per 1K tokens)

### 6. **Ollama** (AI - Local)
**Status:** Optional - Local AI for development/testing
- **Base URL:** `http://localhost:11434` (default)
- **Setup:**
  1. Install Ollama from https://ollama.ai
  2. Run: `ollama pull llama2` (or other model)
  3. Start Ollama service
- **Environment Variables:**
  ```
  OLLAMA_BASE_URL="http://localhost:11434"
  ```
- **Pricing:** Free (runs locally)

### 7. **Cloudflare R2** (File Storage)
**Status:** Optional - For storing invoices, documents, images
- **Account ID:** Get from Cloudflare dashboard
- **Access Key ID:** Create R2 API token
- **Secret Access Key:** From R2 API token
- **Bucket Name:** Create bucket in R2
- **Where to get:**
  1. Sign up at https://cloudflare.com
  2. Go to R2 > Create bucket
  3. Go to Manage R2 API Tokens > Create API token
- **Environment Variables:**
  ```
  CLOUDFLARE_R2_ACCOUNT_ID=""
  CLOUDFLARE_R2_ACCESS_KEY_ID=""
  CLOUDFLARE_R2_SECRET_ACCESS_KEY=""
  CLOUDFLARE_R2_BUCKET_NAME=""
  ```
- **Pricing:** Free tier: 10GB storage, 1M Class A operations/month

### 8. **Sentry** (Error Monitoring)
**Status:** Optional - For production error tracking
- **DSN:** Get from Sentry project settings
- **Where to get:**
  1. Sign up at https://sentry.io
  2. Create new project (Node.js)
  3. Copy DSN from project settings
- **Environment Variables:**
  ```
  SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
  ```
- **Pricing:** Free tier: 5K events/month

---

## 🗄️ Database Setup

### PostgreSQL
**Status:** REQUIRED
- **Version:** PostgreSQL 14+
- **Setup Options:**
  1. **Local:** Install PostgreSQL locally
  2. **Docker:** `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:14`
  3. **Cloud:** Use Supabase, Neon, or Railway (free tiers available)
- **Connection String Format:**
  ```
  DATABASE_URL="postgresql://user:password@localhost:5432/payaid_v3?schema=public"
  ```

### Redis
**Status:** REQUIRED (for caching and queues)
- **Version:** Redis 6+
- **Setup Options:**
  1. **Local:** Install Redis locally
  2. **Docker:** `docker run -d -p 6379:6379 redis:6-alpine`
  3. **Cloud:** Use Upstash or Redis Cloud (free tiers available)
- **Connection String Format:**
  ```
  REDIS_URL="redis://localhost:6379"
  ```

---

## 📋 Setup Priority

### For Development (Minimum Required):
1. ✅ PostgreSQL database
2. ✅ Redis server
3. ✅ JWT_SECRET (generate random string)
4. ✅ NEXTAUTH_SECRET (generate random string)
5. ⚠️ PayAid Payments (can use test mode)
6. ⚠️ SendGrid (free tier sufficient)

### For Production:
1. ✅ All development requirements
2. ✅ PayAid Payments (production credentials)
3. ✅ SendGrid (verified sender)
4. ✅ WATI (for WhatsApp)
5. ✅ Exotel (for SMS)
6. ✅ Cloudflare R2 (for file storage)
7. ✅ Sentry (for monitoring)
8. ✅ OpenAI (optional, for AI fallback)

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong secrets:**
   ```bash
   # Generate JWT secret
   openssl rand -base64 32
   
   # Generate NextAuth secret
   openssl rand -base64 32
   ```
3. **Rotate API keys regularly**
4. **Use environment-specific credentials** (dev/staging/prod)
5. **Enable 2FA on all service accounts**

---

## 🚀 Quick Start Commands

### Generate secure secrets:
```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Linux/Mac
openssl rand -base64 32
```

### Test database connection:
```bash
npx prisma db push
```

### Test Redis connection:
```bash
redis-cli ping
# Should return: PONG
```

---

## 📞 Support Contacts

- **PayAid Payments:** Contact your PayAid Payments account manager
- **SendGrid:** https://support.sendgrid.com
- **WATI:** support@wati.io
- **Exotel:** support@exotel.com
- **Cloudflare:** https://community.cloudflare.com

---

## ✅ Checklist

- [ ] PostgreSQL installed and running
- [ ] Redis installed and running
- [ ] `.env` file created from `env.example`
- [ ] `DATABASE_URL` configured
- [ ] `REDIS_URL` configured
- [ ] `JWT_SECRET` generated and set
- [ ] `NEXTAUTH_SECRET` generated and set
- [ ] PayAid Payments API credentials obtained
- [ ] SendGrid API key obtained
- [ ] Database schema pushed (`npx prisma db push`)
- [ ] All services tested and working

---

**Last Updated:** December 2024
