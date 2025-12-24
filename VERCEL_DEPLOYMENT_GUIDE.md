# Vercel Deployment Guide - PayAid V3

## 🚀 Quick Start

1. **Import Repository** → `PayAidPayments/PayAid-V3`
2. **Configure Environment Variables** (see below)
3. **Deploy**

---

## Step-by-Step Deployment

### Step 1: Import Repository to Vercel

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Search for or enter: `PayAidPayments/PayAid-V3`
5. Click **"Import"**

### Step 2: Configure Project Settings

Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset:** `Next.js`
- **Root Directory:** `/` (leave as default)
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)
- **Install Command:** `npm install` (auto-detected)

**Note:** The `vercel.json` file already contains these settings, so Vercel will use them automatically.

### Step 3: Configure Environment Variables

**Before deploying**, you must add environment variables. Click **"Environment Variables"** and add the following:

#### 🔴 **REQUIRED - Core Application**

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# JWT Authentication (REQUIRED)
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"

# NextAuth (REQUIRED)
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret-change-in-production"

# App Configuration (REQUIRED)
NODE_ENV="production"
APP_URL="https://your-app.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SUBDOMAIN_DOMAIN="payaid.com"

# Encryption Key (REQUIRED - for API keys at rest)
ENCRYPTION_KEY="64-character-hex-string-generate-with-node-crypto"
```

**Generate Encryption Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 🟡 **REQUIRED - PayAid Payments (Platform Payments)**

```env
# PayAid Payments - Admin Credentials (Platform Payments Only)
PAYAID_ADMIN_API_KEY="your-36-digit-merchant-key"
PAYAID_ADMIN_SALT="your-salt-key-KEEP-SECRET"
PAYAID_PAYMENTS_PG_API_URL="https://your-pg-api-url.com"
# Alternative name (both work):
PAYAID_PAYMENTS_BASE_URL="https://your-pg-api-url.com"
```

#### 🟢 **OPTIONAL - AI Services (At least one recommended for chat)**

```env
# AI - Groq (Fast Inference API - Primary Chat Service)
GROQ_API_KEY="gsk_..."
GROQ_MODEL="llama-3.1-8b-instant"

# AI - Hugging Face (Cloud-based, Free tier available)
HUGGINGFACE_API_KEY="hf_..."
HUGGINGFACE_MODEL="google/gemma-2-2b-it"
HUGGINGFACE_IMAGE_MODEL="ByteDance/SDXL-Lightning"

# AI - Google Gemini (Image Generation)
GEMINI_API_KEY="AIza_..."

# AI - Ollama (Local - Not available on Vercel, use for local dev only)
# OLLAMA_BASE_URL="http://localhost:11434" # Not applicable for Vercel
```

#### 🟢 **OPTIONAL - Communication Services**

```env
# Email (SendGrid)
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="noreply@payaid.com"

# WhatsApp (WATI)
WATI_API_KEY="..."
WATI_BASE_URL="https://api.wati.io"

# SMS (Exotel)
EXOTEL_API_KEY="..."
EXOTEL_API_TOKEN="..."
EXOTEL_SID="..."
```

#### 🟢 **OPTIONAL - File Storage**

```env
# Cloudflare R2
CLOUDFLARE_R2_ACCOUNT_ID="..."
CLOUDFLARE_R2_ACCESS_KEY_ID="..."
CLOUDFLARE_R2_SECRET_ACCESS_KEY="..."
CLOUDFLARE_R2_BUCKET_NAME="..."
```

#### 🟢 **OPTIONAL - Monitoring & Other**

```env
# Redis (for queues - optional)
REDIS_URL="redis://..."

# Monitoring
SENTRY_DSN="..."

# Cron Jobs
CRON_SECRET="64-character-hex-string-generate-with-node-crypto"

# Supabase (if using Supabase client library)
SUPABASE_URL="..."
SUPABASE_KEY="..."
```

### Step 4: Deploy

1. After adding environment variables, click **"Deploy"**
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like: `https://payaid-v3.vercel.app`

### Step 5: Update NEXTAUTH_URL (Important!)

After deployment, you'll get your production URL. **Update the environment variable:**

1. Go to **Project Settings** → **Environment Variables**
2. Update `NEXTAUTH_URL` to your actual Vercel URL:
   ```
   NEXTAUTH_URL="https://payaid-v3.vercel.app"
   ```
3. Update `APP_URL` and `NEXT_PUBLIC_APP_URL` to match:
   ```
   APP_URL="https://payaid-v3.vercel.app"
   NEXT_PUBLIC_APP_URL="https://payaid-v3.vercel.app"
   ```
4. **Redeploy** (Vercel will auto-redeploy when you update environment variables)

---

## 🔧 Environment Variable Configuration Tips

### Setting Environment Variables in Vercel

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. For each variable:
   - **Key:** Variable name (e.g., `DATABASE_URL`)
   - **Value:** Variable value (e.g., `postgresql://...`)
   - **Environment:** Select where it applies:
     - ✅ **Production** (for production deployments)
     - ✅ **Preview** (for preview deployments)
     - ✅ **Development** (for local development with Vercel CLI)

### Environment-Specific Values

You can set different values for Production, Preview, and Development:

- **Production:** Use production database, production API keys
- **Preview:** Use staging database, test API keys
- **Development:** Use local development values (if using Vercel CLI)

---

## ✅ Post-Deployment Checklist

- [ ] Deployment successful (no build errors)
- [ ] `NEXTAUTH_URL` updated to production URL
- [ ] `APP_URL` and `NEXT_PUBLIC_APP_URL` updated to production URL
- [ ] Database connection working (test login/registration)
- [ ] PayAid Payments configured (test payment link generation)
- [ ] AI services working (test chat if configured)
- [ ] Custom domain configured (if applicable)

---

## 🐛 Troubleshooting

### Build Fails with Prisma Error

**Error:** `Cannot find module '@prisma/client'`

**Solution:** The `package.json` already includes `prisma generate` in the build script. If issues persist:
1. Check that `DATABASE_URL` is set correctly
2. Verify Prisma schema is valid: `npx prisma validate`

### Build Fails with Module Not Found

**Error:** `Cannot find module '@/lib/...'`

**Solution:** This usually means a missing import. Check:
1. All files are committed to GitHub
2. No local-only files are referenced

### Environment Variables Not Working

**Solution:**
1. Verify variables are set for the correct environment (Production/Preview)
2. Redeploy after adding new variables
3. Check variable names match exactly (case-sensitive)

### Database Connection Issues

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check database allows connections from Vercel IPs
3. For Supabase: Whitelist Vercel IPs or use connection pooling

---

## 📝 Notes

- **Automatic Deployments:** Vercel will automatically deploy when you push to the `main` branch
- **Preview Deployments:** Every pull request gets a preview deployment
- **Environment Variables:** Changes to environment variables require a redeploy
- **Build Time:** First deployment may take longer (5-10 minutes), subsequent deployments are faster (2-5 minutes)

---

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)

---

**Ready to deploy!** Follow the steps above to get your PayAid V3 application live on Vercel.

