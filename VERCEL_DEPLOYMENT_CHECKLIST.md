# Vercel Deployment Checklist

Use this checklist while deploying to Vercel. Check off each item as you complete it.

---

## ✅ Pre-Deployment

- [ ] Repository published to GitHub: `PayAidPayments/PayAid-V3`
- [ ] Have database connection string ready (PostgreSQL)
- [ ] Have PayAid Payments credentials ready (if using)
- [ ] Have API keys ready (AI services, email, etc. - optional)

---

## 🚀 Step 1: Import Repository

- [ ] Go to https://vercel.com/dashboard
- [ ] Click **"Add New..." → "Project"**
- [ ] Search for: `PayAidPayments/PayAid-V3`
- [ ] Click **"Import"**

---

## ⚙️ Step 2: Configure Project Settings

- [ ] Verify Framework: `Next.js` (auto-detected)
- [ ] Verify Root Directory: `/` (default)
- [ ] Verify Build Command: `npm run build` (auto-detected)
- [ ] Verify Output Directory: `.next` (auto-detected)

**Note:** Settings are already configured in `vercel.json`, so defaults should work.

---

## 🔐 Step 3: Add Environment Variables

**Go to: Settings → Environment Variables**

### Required - Core Application

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Random secret key (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] `JWT_EXPIRES_IN` - Set to `"24h"`
- [ ] `NEXTAUTH_URL` - Set to `"https://your-app.vercel.app"` (update after deployment)
- [ ] `NEXTAUTH_SECRET` - Random secret key (generate same way as JWT_SECRET)
- [ ] `NODE_ENV` - Set to `"production"`
- [ ] `APP_URL` - Set to `"https://your-app.vercel.app"` (update after deployment)
- [ ] `NEXT_PUBLIC_APP_URL` - Set to `"https://your-app.vercel.app"` (update after deployment)
- [ ] `NEXT_PUBLIC_SUBDOMAIN_DOMAIN` - Set to `"payaid.com"` (or your domain)
- [ ] `ENCRYPTION_KEY` - 64-character hex string (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

### Required - PayAid Payments (if using)

- [ ] `PAYAID_ADMIN_API_KEY` - 36-digit merchant key
- [ ] `PAYAID_ADMIN_SALT` - Salt key (keep secret!)
- [ ] `PAYAID_PAYMENTS_PG_API_URL` - Payment gateway API URL

### Optional - AI Services (at least one recommended)

- [ ] `GROQ_API_KEY` - For chat (get from https://console.groq.com/keys)
- [ ] `GROQ_MODEL` - Set to `"llama-3.1-8b-instant"`
- [ ] `HUGGINGFACE_API_KEY` - For chat/image generation (get from https://huggingface.co/settings/tokens)
- [ ] `HUGGINGFACE_MODEL` - Set to `"google/gemma-2-2b-it"`
- [ ] `HUGGINGFACE_IMAGE_MODEL` - Set to `"ByteDance/SDXL-Lightning"`
- [ ] `GEMINI_API_KEY` - For image generation (get from https://aistudio.google.com/app/apikey)

### Optional - Communication Services

- [ ] `SENDGRID_API_KEY` - For email
- [ ] `SENDGRID_FROM_EMAIL` - Set to `"noreply@payaid.com"`
- [ ] `WATI_API_KEY` - For WhatsApp
- [ ] `WATI_BASE_URL` - Set to `"https://api.wati.io"`
- [ ] `EXOTEL_API_KEY` - For SMS
- [ ] `EXOTEL_API_TOKEN` - For SMS
- [ ] `EXOTEL_SID` - For SMS

### Optional - File Storage

- [ ] `CLOUDFLARE_R2_ACCOUNT_ID`
- [ ] `CLOUDFLARE_R2_ACCESS_KEY_ID`
- [ ] `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- [ ] `CLOUDFLARE_R2_BUCKET_NAME`

### Optional - Other

- [ ] `REDIS_URL` - For queues (if using)
- [ ] `SENTRY_DSN` - For monitoring (if using)
- [ ] `CRON_SECRET` - 64-character hex string (generate same way as ENCRYPTION_KEY)

**For each variable:**
- Select environment: ✅ Production, ✅ Preview, ✅ Development (as needed)
- Click **"Save"**

---

## 🚀 Step 4: Deploy

- [ ] Click **"Deploy"** button
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Note your deployment URL (e.g., `https://payaid-v3.vercel.app`)

---

## 🔄 Step 5: Update URLs (Important!)

After deployment, you'll get your production URL. Update these environment variables:

- [ ] Go to **Settings → Environment Variables**
- [ ] Update `NEXTAUTH_URL` to your actual Vercel URL
- [ ] Update `APP_URL` to your actual Vercel URL
- [ ] Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
- [ ] **Redeploy** (Vercel will auto-redeploy when you update environment variables)

---

## ✅ Step 6: Verify Deployment

- [ ] Visit your deployment URL
- [ ] Test landing page loads
- [ ] Test registration/login (verify database connection)
- [ ] Test dashboard access (verify authentication)
- [ ] Test payment link generation (if PayAid Payments configured)
- [ ] Test AI chat (if AI services configured)

---

## 📝 Post-Deployment

- [ ] Share URL with team
- [ ] Configure custom domain (if applicable)
- [ ] Set up monitoring (if using Sentry)
- [ ] Document any custom configurations

---

## 🐛 If Build Fails

- [ ] Check build logs in Vercel dashboard
- [ ] Verify all required environment variables are set
- [ ] Check `DATABASE_URL` is correct and accessible
- [ ] Verify Prisma schema is valid
- [ ] Check for any missing dependencies

---

## 📚 Need Help?

- See **[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)** for detailed instructions
- See **[env.example](./env.example)** for all available environment variables

---

**Ready to deploy!** Follow this checklist step by step.

