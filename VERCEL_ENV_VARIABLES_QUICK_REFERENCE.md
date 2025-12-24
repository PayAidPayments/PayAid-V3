# Vercel Environment Variables - Quick Reference

When adding environment variables in Vercel, you'll see a form asking for:
- **Key** (variable name)
- **Value** (variable value)
- **Environment** (Production/Preview/Development)

---

## 🔴 REQUIRED - Add These First

### 1. Database Connection

**Key:** `DATABASE_URL`  
**Value:** `postgresql://user:password@host:5432/database?schema=public`  
**Example:** `postgresql://postgres:mypassword@db.abc123.supabase.co:5432/postgres?schema=public`  
**Environment:** ✅ Production, ✅ Preview

---

### 2. JWT Secret

**Key:** `JWT_SECRET`  
**Value:** Generate a random 64-character hex string  
**How to generate:** Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Example:** `a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`  
**Environment:** ✅ Production, ✅ Preview

---

### 3. JWT Expires In

**Key:** `JWT_EXPIRES_IN`  
**Value:** `24h`  
**Environment:** ✅ Production, ✅ Preview

---

### 4. NextAuth URL (Update After Deployment)

**Key:** `NEXTAUTH_URL`  
**Value:** `https://your-app.vercel.app`  
**Note:** Replace `your-app.vercel.app` with your actual Vercel URL after first deployment  
**Example:** `https://payaid-v3.vercel.app`  
**Environment:** ✅ Production, ✅ Preview

---

### 5. NextAuth Secret

**Key:** `NEXTAUTH_SECRET`  
**Value:** Generate a random 64-character hex string (same as JWT_SECRET, but use a different value)  
**How to generate:** Run this command:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Example:** `f9e8d7c6b5a4321098765432109876543210fedcba9876543210fedcba987654`  
**Environment:** ✅ Production, ✅ Preview

---

### 6. Node Environment

**Key:** `NODE_ENV`  
**Value:** `production`  
**Environment:** ✅ Production, ✅ Preview

---

### 7. App URL (Update After Deployment)

**Key:** `APP_URL`  
**Value:** `https://your-app.vercel.app`  
**Note:** Replace `your-app.vercel.app` with your actual Vercel URL after first deployment  
**Example:** `https://payaid-v3.vercel.app`  
**Environment:** ✅ Production, ✅ Preview

---

### 8. Public App URL (Update After Deployment)

**Key:** `NEXT_PUBLIC_APP_URL`  
**Value:** `https://your-app.vercel.app`  
**Note:** Replace `your-app.vercel.app` with your actual Vercel URL after first deployment  
**Example:** `https://payaid-v3.vercel.app`  
**Environment:** ✅ Production, ✅ Preview

---

### 9. Subdomain Domain

**Key:** `NEXT_PUBLIC_SUBDOMAIN_DOMAIN`  
**Value:** `payaid.com`  
**Note:** Change to your custom domain if you have one  
**Environment:** ✅ Production, ✅ Preview

---

### 10. Encryption Key

**Key:** `ENCRYPTION_KEY`  
**Value:** Generate a random 64-character hex string  
**How to generate:** Run this command:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Example:** `1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`  
**Environment:** ✅ Production, ✅ Preview

---

## 🟡 REQUIRED - PayAid Payments (If Using)

### 11. PayAid Admin API Key

**Key:** `PAYAID_ADMIN_API_KEY`  
**Value:** Your 36-digit merchant key  
**Example:** `f14e50fd-82f0-4ce0-bd4e-de924908d4ff`  
**Environment:** ✅ Production, ✅ Preview

---

### 12. PayAid Admin Salt

**Key:** `PAYAID_ADMIN_SALT`  
**Value:** Your salt key (KEEP SECRET!)  
**Example:** `your-salt-key-here-keep-this-secret`  
**Environment:** ✅ Production, ✅ Preview

---

### 13. PayAid Payments Base URL

**Key:** `PAYAID_PAYMENTS_PG_API_URL`  
**Value:** Your payment gateway API URL  
**Example:** `https://api.payaidpayments.com`  
**Environment:** ✅ Production, ✅ Preview

---

## 🟢 OPTIONAL - AI Services

### 14. Groq API Key (For Chat)

**Key:** `GROQ_API_KEY`  
**Value:** Your Groq API key (starts with `gsk_`)  
**Get from:** https://console.groq.com/keys  
**Example:** `gsk_1234567890abcdef1234567890abcdef`  
**Environment:** ✅ Production, ✅ Preview

---

### 15. Groq Model

**Key:** `GROQ_MODEL`  
**Value:** `llama-3.1-8b-instant`  
**Environment:** ✅ Production, ✅ Preview

---

### 16. Hugging Face API Key

**Key:** `HUGGINGFACE_API_KEY`  
**Value:** Your Hugging Face API key (starts with `hf_`)  
**Get from:** https://huggingface.co/settings/tokens  
**Example:** `hf_1234567890abcdef1234567890abcdef`  
**Environment:** ✅ Production, ✅ Preview

---

### 17. Hugging Face Model

**Key:** `HUGGINGFACE_MODEL`  
**Value:** `google/gemma-2-2b-it`  
**Environment:** ✅ Production, ✅ Preview

---

### 18. Hugging Face Image Model

**Key:** `HUGGINGFACE_IMAGE_MODEL`  
**Value:** `ByteDance/SDXL-Lightning`  
**Environment:** ✅ Production, ✅ Preview

---

### 19. Gemini API Key (For Image Generation)

**Key:** `GEMINI_API_KEY`  
**Value:** Your Google AI Studio API key (starts with `AIza_`)  
**Get from:** https://aistudio.google.com/app/apikey  
**Example:** `AIzaSy1234567890abcdef1234567890abcdef`  
**Environment:** ✅ Production, ✅ Preview

---

## 🟢 OPTIONAL - Communication Services

### 20. SendGrid API Key

**Key:** `SENDGRID_API_KEY`  
**Value:** Your SendGrid API key (starts with `SG.`)  
**Example:** `SG.1234567890abcdef1234567890abcdef`  
**Environment:** ✅ Production, ✅ Preview

---

### 21. SendGrid From Email

**Key:** `SENDGRID_FROM_EMAIL`  
**Value:** `noreply@payaid.com`  
**Note:** Change to your verified sender email  
**Environment:** ✅ Production, ✅ Preview

---

## 📝 How to Add in Vercel

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. For each variable above:
   - Click **"Add New"**
   - Enter the **Key** (exactly as shown)
   - Enter the **Value** (your actual value)
   - Select **Environment**: Check ✅ Production, ✅ Preview (and ✅ Development if needed)
   - Click **"Save"**
4. Repeat for all variables

---

## ⚠️ Important Notes

1. **Generate Secrets:** For `JWT_SECRET`, `NEXTAUTH_SECRET`, and `ENCRYPTION_KEY`, use different random values for each.

2. **Update URLs After Deployment:** After your first deployment, you'll get a URL like `https://payaid-v3.vercel.app`. Update:
   - `NEXTAUTH_URL`
   - `APP_URL`
   - `NEXT_PUBLIC_APP_URL`
   Then redeploy.

3. **Case Sensitive:** Variable names are case-sensitive. Use exact capitalization as shown.

4. **No Quotes:** Don't add quotes around values in Vercel (unless the value itself should contain quotes).

5. **Environment Selection:** 
   - **Production:** For production deployments
   - **Preview:** For preview deployments (pull requests)
   - **Development:** Only if using Vercel CLI for local development

---

## 🚀 Quick Start - Minimum Required

If you want to deploy quickly and add optional features later, add these **10 required variables** first:

1. `DATABASE_URL`
2. `JWT_SECRET`
3. `JWT_EXPIRES_IN` = `24h`
4. `NEXTAUTH_URL` = `https://your-app.vercel.app` (update after deployment)
5. `NEXTAUTH_SECRET`
6. `NODE_ENV` = `production`
7. `APP_URL` = `https://your-app.vercel.app` (update after deployment)
8. `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app` (update after deployment)
9. `NEXT_PUBLIC_SUBDOMAIN_DOMAIN` = `payaid.com`
10. `ENCRYPTION_KEY`

Then deploy, get your URL, update the URLs, and redeploy!

---

**Need help generating secrets?** Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

