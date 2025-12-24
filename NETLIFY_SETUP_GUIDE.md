# Netlify Setup Guide - Free Private Repositories

This guide will help you migrate from Vercel to Netlify to get free private repository support.

---

## 🚀 Step 1: Sign Up for Netlify

1. Go to: https://app.netlify.com
2. Click **"Sign up"**
3. Choose **"Sign up with GitHub"**
4. Authorize Netlify to access your GitHub account
5. Select your organization: **PayAidPayments**

---

## 📦 Step 2: Import Your Repositories

For each of your 9 modules:

1. In Netlify dashboard, click **"Add new site"** → **"Import an existing project"**
2. Select **"Deploy with GitHub"**
3. Choose repository: `PayAidPayments/payaid-[module]`
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 18 (or leave default)
5. Click **"Deploy site"**
6. **Note the Site ID** (you'll need this for GitHub secrets)

**Repeat for all 9 modules:**
- payaid-core
- payaid-crm
- payaid-finance
- payaid-hr
- payaid-marketing
- payaid-whatsapp
- payaid-analytics
- payaid-ai-studio
- payaid-communication

---

## 🔑 Step 3: Get Netlify Auth Token

1. Go to: https://app.netlify.com/user/applications
2. Click **"New access token"**
3. Enter description: `PayAid CI/CD`
4. Click **"Generate token"**
5. **Copy the token immediately** (you won't see it again)
6. This is your `NETLIFY_AUTH_TOKEN`

---

## 🔐 Step 4: Add GitHub Secrets

### Organization-Level Secret (One Time)

1. Go to: https://github.com/organizations/PayAidPayments/settings/secrets/actions
2. Click **"New organization secret"**
3. **Name:** `NETLIFY_AUTH_TOKEN`
4. **Value:** [Your Netlify auth token from Step 3]
5. **Repository access:** All repositories
6. Click **"Add secret"**

### Repository-Level Secrets (For Each Module)

For each of the 9 repositories:

1. Go to: `https://github.com/PayAidPayments/payaid-[module]/settings/secrets/actions`
2. Click **"New repository secret"**
3. **Name:** `NETLIFY_SITE_ID`
4. **Value:** [Site ID from Netlify dashboard for that module]
5. Click **"Add secret"**

**How to find Site ID:**
- In Netlify dashboard, go to your site
- Go to **Site settings** → **General**
- Find **"Site ID"** (starts with something like `abc123...`)

---

## 📝 Step 5: Commit Updated Workflows

The workflows have been updated. Commit and push them:

```powershell
# For each repository, commit the workflow changes
cd repositories\payaid-core
git add .github/workflows/deploy.yml
git commit -m "chore: Migrate from Vercel to Netlify"
git push origin main

# Repeat for other modules...
```

Or use the script I'll create to do this automatically.

---

## ✅ Step 6: Test Deployment

1. Make a small change to any repository
2. Commit and push:
   ```bash
   git add .
   git commit -m "test: Netlify deployment"
   git push origin main
   ```
3. Check GitHub Actions: Should show "Deploy to Netlify" step
4. Check Netlify dashboard: Should show new deployment

---

## 📊 Netlify vs Vercel Comparison

| Feature | Netlify (Free) | Vercel (Hobby) |
|---------|---------------|----------------|
| Private Repos | ✅ Yes | ❌ No |
| Build Minutes | 300/month | 6,000/month |
| Bandwidth | 100 GB/month | 100 GB/month |
| Deployments | Unlimited | Unlimited |
| Team Members | 1 | 1 |
| **Cost** | **Free** | **Free** (public only) |

---

## 🎯 Quick Setup Checklist

- [ ] Sign up for Netlify
- [ ] Import all 9 repositories
- [ ] Note all Site IDs
- [ ] Create Netlify auth token
- [ ] Add `NETLIFY_AUTH_TOKEN` to GitHub organization secrets
- [ ] Add `NETLIFY_SITE_ID` to each repository secret (9 times)
- [ ] Commit and push updated workflow files
- [ ] Test deployment
- [ ] Verify all 9 modules deploy successfully

---

## 🛠️ Troubleshooting

### Build Fails: "Build command not found"
- **Solution:** Ensure build command is `npm run build` in Netlify settings

### Deployment Fails: "Site ID not found"
- **Solution:** Verify `NETLIFY_SITE_ID` secret matches the Site ID in Netlify dashboard

### Auth Token Error
- **Solution:** Regenerate token and update GitHub secret

### Build Timeout
- **Solution:** Netlify free tier has 15-minute build timeout. Optimize build if needed.

---

## 📚 Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify GitHub Integration](https://docs.netlify.com/integrations/github/)
- [Netlify Build Settings](https://docs.netlify.com/configure-builds/overview/)

---

**Status:** Ready to migrate! Follow the steps above to complete the setup.

