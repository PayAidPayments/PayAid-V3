# Deploy Main Unified Application - Single URL Setup

## 🎯 Goal

Deploy the **main PayAid application** (in root directory) to Vercel so your team can access the entire platform from **ONE URL**:
- Landing page
- Sign up / Sign in
- All modules and features
- Complete platform experience

---

## 📍 Current Situation

- ✅ **Main application** is in root directory (`D:\Cursor Projects\PayAid V3`)
- ❌ **Not yet in GitHub** (needs to be published)
- ❌ **Not yet deployed** to Vercel

---

## 🚀 Step-by-Step Setup

### Step 1: Initialize Git in Root Directory

```powershell
cd "D:\Cursor Projects\PayAid V3"
git init
git add .
git commit -m "Initial commit: PayAid V3 unified platform"
git branch -M main
```

### Step 2: Create GitHub Repository

**Option A: Using GitHub Desktop (Easiest)**

1. Open GitHub Desktop
2. File → Add Local Repository
3. Browse to: `D:\Cursor Projects\PayAid V3`
4. Click "Publish repository"
5. Owner: `PayAidPayments`
6. Name: `PayAid-V3` (or `payaid-platform`)
7. Description: "PayAid V3 - Unified Business Management Platform"
8. Make it **PUBLIC** (for free Vercel)
9. Click "Publish Repository"

**Option B: Using GitHub Web**

1. Go to: https://github.com/organizations/PayAidPayments/repositories/new
2. Repository name: `PayAid-V3`
3. Description: "PayAid V3 - Unified Business Management Platform"
4. Make it **PUBLIC**
5. **Don't** initialize with README (you already have code)
6. Click "Create repository"
7. Then push your code (see Step 3)

### Step 3: Push to GitHub

If you used GitHub Desktop, it's already pushed. Otherwise:

```powershell
git remote add origin https://github.com/PayAidPayments/PayAid-V3.git
git push -u origin main
```

### Step 4: Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to: https://vercel.com/dashboard
2. Click **"Add New..." → "Project"**
3. **Import Git Repository:**
   - Select: `PayAidPayments/PayAid-V3`
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `/` (root)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
4. **Environment Variables:**
   - Add all variables from your `.env.example`
   - Database URL, API keys, etc.
5. Click **"Deploy"**

**Option B: Via Vercel CLI**

```powershell
cd "D:\Cursor Projects\PayAid V3"
vercel link
# Select your organization
# Create new project or link existing
vercel --prod
```

### Step 5: Get Your Single URL

After deployment, Vercel will give you a URL like:
- `https://payaid-v3.vercel.app` (or similar)

**This is your single URL for the entire platform!**

---

## 🌐 What Team Members Will Access

### From the Single URL:

**Public Pages (No Login):**
- `/` - Landing page with features
- `/register` - Sign up page
- `/login` - Sign in page

**After Login:**
- `/dashboard` - Main dashboard
- `/dashboard/crm` - CRM module
- `/dashboard/finance` - Finance module
- `/dashboard/hr` - HR module
- `/dashboard/marketing` - Marketing module
- `/dashboard/whatsapp` - WhatsApp module
- `/dashboard/analytics` - Analytics module
- `/dashboard/ai-studio` - AI Studio module
- `/dashboard/communication` - Communication module

**Everything accessible from ONE URL!**

---

## 🔐 Environment Variables Needed

Add these in Vercel project settings:

**Database:**
- `DATABASE_URL` - PostgreSQL connection string

**Authentication:**
- `JWT_SECRET` - JWT signing secret
- `NEXTAUTH_SECRET` - NextAuth secret (if used)

**PayAid Payments:**
- `PAYAID_API_KEY` - Your PayAid API key
- `PAYAID_SALT` - PayAid salt

**Other:**
- Any other variables from `.env.example`

---

## ✅ Quick Checklist

- [ ] Git initialized in root directory
- [ ] Code committed
- [ ] GitHub repository created (public)
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Single URL obtained
- [ ] Team access document created
- [ ] URL shared with team

---

## 📝 Team Access Document

After deployment, I'll create a document with:
- Single platform URL
- How to access
- What to test
- Feedback collection method

---

## 🎯 Next Steps

1. **Initialize Git** in root directory
2. **Create GitHub repository** (public)
3. **Push code** to GitHub
4. **Deploy to Vercel**
5. **Get single URL**
6. **Share with team**

Would you like me to:
1. Create a script to initialize Git and prepare for GitHub?
2. Help you deploy via Vercel CLI?
3. Create the team access document template?

