# Quick Deploy Main Application - Single URL Setup

## ✅ What's Ready

- ✅ Git initialized in root directory
- ✅ Initial commit created
- ✅ `.gitignore` updated (excludes separate module repos)

---

## 🚀 Deploy in 3 Steps

### Step 1: Publish to GitHub (5 min)

**Using GitHub Desktop (Easiest):**

1. Open GitHub Desktop
2. **File → Add Local Repository...**
3. Browse to: `D:\Cursor Projects\PayAid V3`
4. Click **"Publish repository"** button
5. Settings:
   - **Owner:** `PayAidPayments`
   - **Name:** `PayAid-V3`
   - **Description:** "PayAid V3 - Unified Business Management Platform"
   - **Make it PUBLIC** (uncheck "Keep this code private")
6. Click **"Publish Repository"**

### Step 2: Deploy to Vercel (5 min)

1. Go to: https://vercel.com/dashboard
2. Click **"Add New..." → "Project"**
3. **Import:** `PayAidPayments/PayAid-V3`
4. **Settings:**
   - Framework: Next.js (auto-detected)
   - Root Directory: `/`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. **Environment Variables:**
   - Add variables from `.env.example`
   - Database URL, API keys, etc.
6. Click **"Deploy"**

### Step 3: Get Your URL & Share (1 min)

After deployment:
- **Copy the URL** (e.g., `https://payaid-v3.vercel.app`)
- **Share with team**
- **Done!**

---

## 🌐 Your Single URL Will Show:

**Public Pages:**
- `/` - Landing page
- `/register` - Sign up
- `/login` - Sign in

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

**Everything from ONE URL - just like localhost:3000!**

---

## 📝 Environment Variables Needed

Add these in Vercel project settings:

- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - JWT signing secret
- `PAYAID_API_KEY` - PayAid API key
- `PAYAID_SALT` - PayAid salt
- Any others from `.env.example`

---

## ✅ Quick Checklist

- [x] Git initialized
- [x] Code committed
- [ ] Published to GitHub (public)
- [ ] Deployed to Vercel
- [ ] Environment variables added
- [ ] Single URL obtained
- [ ] Shared with team

---

**Ready to deploy!** Follow the 3 steps above to get your single URL.

