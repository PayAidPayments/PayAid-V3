# Netlify Quick Start Guide

## ✅ What's Done

- ✅ All 9 workflow files updated to use Netlify
- ✅ Workflows ready to deploy (just need Netlify setup)

## 🚀 Next Steps (15 minutes)

### Step 1: Sign Up & Import (5 min)

1. **Sign up:** https://app.netlify.com → "Sign up with GitHub"
2. **Authorize:** Allow Netlify to access PayAidPayments organization
3. **Import sites:** For each module:
   - Click "Add new site" → "Import an existing project"
   - Select `PayAidPayments/payaid-[module]`
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Click "Deploy site"
   - **Copy the Site ID** (you'll need it)

**Modules to import:**
- payaid-core
- payaid-crm
- payaid-finance
- payaid-hr
- payaid-marketing
- payaid-whatsapp
- payaid-analytics
- payaid-ai-studio
- payaid-communication

### Step 2: Get Auth Token (2 min)

1. Go to: https://app.netlify.com/user/applications
2. Click "New access token"
3. Name: `PayAid CI/CD`
4. Click "Generate token"
5. **Copy token** (save it!)

### Step 3: Add GitHub Secrets (5 min)

#### Organization Secret (One Time):
1. Go to: https://github.com/organizations/PayAidPayments/settings/secrets/actions
2. "New organization secret"
3. Name: `NETLIFY_AUTH_TOKEN`
4. Value: [Your token from Step 2]
5. Save

#### Repository Secrets (9 times):
For each module:
1. Go to: `https://github.com/PayAidPayments/payaid-[module]/settings/secrets/actions`
2. "New repository secret"
3. Name: `NETLIFY_SITE_ID`
4. Value: [Site ID from Netlify for that module]
5. Save

### Step 4: Commit & Push Workflows (3 min)

```powershell
.\scripts\commit-netlify-workflows.ps1
```

Or manually for each:
```powershell
cd repositories\payaid-core
git add .github/workflows/deploy.yml
git commit -m "chore: Migrate to Netlify"
git push origin main
```

### Step 5: Test! (1 min)

Make a small change and push:
```powershell
cd repositories\payaid-core
echo "# Test" >> README.md
git add README.md
git commit -m "test: Netlify deployment"
git push origin main
```

Check:
- GitHub Actions: https://github.com/PayAidPayments/payaid-core/actions
- Netlify Dashboard: https://app.netlify.com

## 📋 Site IDs Checklist

After importing, note each Site ID:

| Module | Site ID |
|--------|---------|
| payaid-core | `_________________` |
| payaid-crm | `_________________` |
| payaid-finance | `_________________` |
| payaid-hr | `_________________` |
| payaid-marketing | `_________________` |
| payaid-whatsapp | `_________________` |
| payaid-analytics | `_________________` |
| payaid-ai-studio | `_________________` |
| payaid-communication | `_________________` |

## ✅ Verification Checklist

- [ ] Netlify account created
- [ ] All 9 repositories imported to Netlify
- [ ] All Site IDs collected
- [ ] Netlify auth token created
- [ ] `NETLIFY_AUTH_TOKEN` added to GitHub organization
- [ ] `NETLIFY_SITE_ID` added to all 9 repositories
- [ ] Workflow files committed and pushed
- [ ] Test deployment successful

## 🎉 You're Done!

Once all secrets are added, every push to `main` will:
1. Build your code
2. Run tests
3. Deploy to Netlify automatically

**All for FREE with private repositories!**

---

**Need help?** See `NETLIFY_SETUP_GUIDE.md` for detailed instructions.

