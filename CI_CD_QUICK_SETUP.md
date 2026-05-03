# CI/CD Quick Setup Checklist

## 🚀 Fast Track Setup (15 minutes)

### Step 1: Get Vercel Credentials (5 min)

1. **Vercel Token:**
   - Go to: https://vercel.com/account/tokens
   - Create token → Name: "PayAid CI/CD"
   - Copy token: `________________________`

2. **Vercel Organization ID:**
   - Go to: https://vercel.com/account
   - Settings → General → Team ID
   - Copy ID: `________________________`

### Step 2: Add Organization Secrets (2 min)

1. Go to: https://github.com/organizations/PayAidPayments/settings/secrets/actions
2. Add secret: `VERCEL_TOKEN` = [your token from Step 1]
3. Add secret: `VERCEL_ORG_ID` = [your org ID from Step 1]

### Step 3: Create Vercel Projects (5 min)

For each module, create a Vercel project:

**Option A: Via Dashboard (Easier)**
1. Go to: https://vercel.com/dashboard
2. Add New → Project
3. Import from GitHub: `PayAidPayments/payaid-[module]`
4. Deploy
5. Copy Project ID from Settings → General

**Option B: Via CLI (Faster)**
```bash
npm i -g vercel
vercel login

# For each module:
cd repositories/payaid-core && vercel link && cd ../..
cd repositories/payaid-crm && vercel link && cd ../..
cd repositories/payaid-finance && vercel link && cd ../..
cd repositories/payaid-hr && vercel link && cd ../..
cd repositories/payaid-marketing && vercel link && cd ../..
cd repositories/payaid-whatsapp && vercel link && cd ../..
cd repositories/payaid-analytics && vercel link && cd ../..
cd repositories/payaid-ai-studio && vercel link && cd ../..
cd repositories/payaid-communication && vercel link && cd ../..
```

### Step 4: Add Project IDs to Repositories (3 min)

For each repository, add the `VERCEL_PROJECT_ID` secret:

| Repository | Vercel Project ID |
|------------|------------------|
| payaid-core | `________________________` |
| payaid-crm | `________________________` |
| payaid-finance | `________________________` |
| payaid-hr | `________________________` |
| payaid-marketing | `________________________` |
| payaid-whatsapp | `________________________` |
| payaid-analytics | `________________________` |
| payaid-ai-studio | `________________________` |
| payaid-communication | `________________________` |

**To add:**
1. Go to: `https://github.com/PayAidPayments/payaid-[module]/settings/secrets/actions`
2. New repository secret
3. Name: `VERCEL_PROJECT_ID`
4. Value: [Project ID from table above]
5. Add secret

### Step 5: Test (1 min)

1. Make a small change to any repository
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test CI/CD"
   git push
   ```
3. Check Actions tab: `https://github.com/PayAidPayments/payaid-[module]/actions`
4. Verify deployment on Vercel dashboard

---

## ✅ Verification Checklist

- [ ] Vercel token created
- [ ] `VERCEL_TOKEN` secret added to organization
- [ ] `VERCEL_ORG_ID` secret added to organization
- [ ] Vercel project created for payaid-core
- [ ] Vercel project created for payaid-crm
- [ ] Vercel project created for payaid-finance
- [ ] Vercel project created for payaid-hr
- [ ] Vercel project created for payaid-marketing
- [ ] Vercel project created for payaid-whatsapp
- [ ] Vercel project created for payaid-analytics
- [ ] Vercel project created for payaid-ai-studio
- [ ] Vercel project created for payaid-communication
- [ ] `VERCEL_PROJECT_ID` added to all 9 repositories
- [ ] Test workflow run successfully
- [ ] Deployment verified on Vercel

---

## 📚 Full Documentation

For detailed instructions, see: [CI_CD_SETUP_GUIDE.md](./CI_CD_SETUP_GUIDE.md)

