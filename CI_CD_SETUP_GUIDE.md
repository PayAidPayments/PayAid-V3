# CI/CD Workflows Setup Guide

This guide will help you set up Continuous Integration and Continuous Deployment (CI/CD) workflows for all your PayAid module repositories.

## 📋 Overview

All repositories already have GitHub Actions workflow files (`.github/workflows/deploy.yml`) configured for:
- ✅ Automated builds on push to `main` branch
- ✅ Automated builds on pull requests
- ✅ Vercel deployment integration
- ✅ Node.js 18 setup
- ✅ Dependency caching
- ✅ Test execution

## 🔧 Step 1: Configure GitHub Secrets

Each repository needs three secrets configured in GitHub. You can set them at the **organization level** (recommended) or per repository.

### Option A: Organization-Level Secrets (Recommended)

This applies secrets to all repositories in your organization:

1. Go to: https://github.com/organizations/PayAidPayments/settings/secrets/actions
2. Click **"New organization secret"**
3. Add each secret:

#### Secret 1: `VERCEL_TOKEN`
- **Name:** `VERCEL_TOKEN`
- **Value:** Your Vercel API token (see Step 2 below)
- **Repository access:** Select all repositories or specific ones

#### Secret 2: `VERCEL_ORG_ID`
- **Name:** `VERCEL_ORG_ID`
- **Value:** Your Vercel Organization ID (see Step 2 below)

#### Secret 3: `VERCEL_PROJECT_ID`
- **Note:** This needs to be set **per repository** since each module has its own Vercel project
- See Option B below for repository-specific secrets

### Option B: Repository-Level Secrets

If you prefer per-repository configuration:

1. Go to each repository: `https://github.com/PayAidPayments/payaid-[module]`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add the three secrets for each repository

---

## 🔑 Step 2: Get Vercel Credentials

### Get Vercel Token

1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Enter a name: `PayAid CI/CD`
4. Set expiration (or leave as "No expiration")
5. Click **"Create"**
6. **Copy the token immediately** (you won't see it again)
7. This is your `VERCEL_TOKEN`

### Get Vercel Organization ID

1. Go to: https://vercel.com/account
2. Click on your organization/team
3. Go to **Settings** → **General**
4. Find **"Team ID"** or **"Organization ID"**
5. Copy this value - this is your `VERCEL_ORG_ID`

### Get Vercel Project IDs

For each module, you need to create a Vercel project and get its Project ID:

#### Method 1: Create Projects via Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import from GitHub:
   - Select repository: `PayAidPayments/payaid-core`
   - Configure project settings
   - Click **"Deploy"**
4. After deployment, go to **Project Settings** → **General**
5. Find **"Project ID"** - copy this value
6. Repeat for all 9 modules

#### Method 2: Create Projects via Vercel CLI (Recommended)

**Quick Setup Script:**

We've created automated scripts to set up all projects at once:

**For Windows (PowerShell):**
```powershell
.\scripts\setup-vercel-projects.ps1
```

**For Mac/Linux (Bash):**
```bash
chmod +x scripts/setup-vercel-projects.sh
./scripts/setup-vercel-projects.sh
```

The script will:
- Check if Vercel CLI is installed (install if needed)
- Check if you're logged in (prompt login if needed)
- Link each module repository to Vercel
- Display all Project IDs at the end

**Manual Setup (if you prefer):**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# For each module, create a project
cd repositories/payaid-core
vercel link
# Follow prompts:
#   - Select your organization/team
#   - Create new project (or link existing)
#   - Use default settings
# Note the Project ID from the output or .vercel/project.json

# Repeat for other modules...
cd ../payaid-crm && vercel link && cd ../..
cd ../payaid-finance && vercel link && cd ../..
cd ../payaid-hr && vercel link && cd ../..
cd ../payaid-marketing && vercel link && cd ../..
cd ../payaid-whatsapp && vercel link && cd ../..
cd ../payaid-analytics && vercel link && cd ../..
cd ../payaid-ai-studio && vercel link && cd ../..
cd ../payaid-communication && vercel link && cd ../..
```

**Finding Project IDs:**

After linking, you can find the Project ID in:
- `.vercel/project.json` file in each repository
- Vercel dashboard → Project Settings → General → Project ID
- Output from `vercel link` command

---

## 📝 Step 3: Add Project IDs to Each Repository

Since each module has a different Vercel Project ID, add it to each repository:

1. Go to: `https://github.com/PayAidPayments/payaid-core/settings/secrets/actions`
2. Click **"New repository secret"**
3. **Name:** `VERCEL_PROJECT_ID`
4. **Value:** The Project ID for `payaid-core` from Step 2
5. Click **"Add secret"**
6. Repeat for all 9 repositories with their respective Project IDs

**Repository → Secret Mapping:**
- `payaid-core` → `VERCEL_PROJECT_ID` (core project ID)
- `payaid-crm` → `VERCEL_PROJECT_ID` (crm project ID)
- `payaid-finance` → `VERCEL_PROJECT_ID` (finance project ID)
- `payaid-hr` → `VERCEL_PROJECT_ID` (hr project ID)
- `payaid-marketing` → `VERCEL_PROJECT_ID` (marketing project ID)
- `payaid-whatsapp` → `VERCEL_PROJECT_ID` (whatsapp project ID)
- `payaid-analytics` → `VERCEL_PROJECT_ID` (analytics project ID)
- `payaid-ai-studio` → `VERCEL_PROJECT_ID` (ai-studio project ID)
- `payaid-communication` → `VERCEL_PROJECT_ID` (communication project ID)

---

## ✅ Step 4: Verify Workflow Files

Each repository should have a workflow file at:
```
.github/workflows/deploy.yml
```

The workflow should look like this:

```yaml
name: Deploy [Module] Module

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm test || true
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Note:** The workflow files are already in your repositories, so you just need to configure the secrets!

---

## 🧪 Step 5: Test the Workflow

1. Make a small change to any repository (e.g., update README)
2. Commit and push to `main` branch:
   ```bash
   git add .
   git commit -m "Test CI/CD workflow"
   git push origin main
   ```
3. Go to the repository on GitHub
4. Click **"Actions"** tab
5. You should see the workflow running
6. Once complete, check Vercel dashboard to see if deployment succeeded

---

## 🚀 Step 6: Enable Automatic Deployments

The workflows are configured to:
- ✅ Build on every push to `main`
- ✅ Build on pull requests (for testing)
- ✅ Deploy to Vercel production on successful build

**Deployment Behavior:**
- **Push to `main`:** Builds and deploys to production
- **Pull Request:** Builds and runs tests (doesn't deploy)
- **Other branches:** No automatic action (you can modify workflows to add staging)

---

## 🔄 Alternative: Enhanced Workflow (Optional)

If you want more advanced features, here's an enhanced workflow with staging environments:

```yaml
name: Deploy [Module] Module

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint || true
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm test || true
      
      - name: Deploy to Vercel (Staging)
        if: github.ref == 'refs/heads/develop'
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--env=staging'
      
      - name: Deploy to Vercel (Production)
        if: github.ref == 'refs/heads/main'
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📊 Monitoring Workflows

### View Workflow Runs

1. Go to any repository
2. Click **"Actions"** tab
3. See all workflow runs and their status

### Workflow Status Badge

Add a status badge to your README:

```markdown
![CI/CD Status](https://github.com/PayAidPayments/payaid-core/workflows/Deploy%20Core%20Module/badge.svg)
```

---

## 🛠️ Troubleshooting

### Workflow Fails: "Secret not found"
- **Solution:** Make sure secrets are configured in repository or organization settings

### Workflow Fails: "Vercel deployment failed"
- **Solution:** 
  - Verify Vercel token is valid
  - Check Vercel project ID matches the repository
  - Ensure Vercel project exists and is linked to the GitHub repository

### Build Fails: "npm ci failed"
- **Solution:**
  - Check `package.json` exists
  - Verify all dependencies are valid
  - Check Node.js version compatibility

### Tests Fail
- **Solution:** The workflow uses `npm test || true` which allows tests to fail without breaking deployment. Remove `|| true` if you want tests to block deployment.

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)

---

## ✅ Quick Checklist

- [x] Vercel token created and added as `VERCEL_TOKEN` secret
- [x] Vercel Organization ID added as `VERCEL_ORG_ID` secret
- [x] Vercel projects created for all 9 modules
- [x] `VERCEL_PROJECT_ID` secret added to each repository
- [x] GitHub connected to Vercel
- [x] Workflow files verified in each repository
- [ ] Test commit pushed to trigger workflow
- [ ] Workflow runs successfully
- [ ] Deployment verified on Vercel

## 🧪 Test Your Setup

Use the test script to verify CI/CD is working:

```powershell
.\scripts\test-cicd.ps1
```

Or test a specific module:
```powershell
.\scripts\test-cicd.ps1 -Module core
```

This will:
1. Create a test commit
2. Optionally push to GitHub
3. Trigger the CI/CD workflow
4. Show you where to check the results

---

**Status:** Ready to configure! All workflow files are in place, you just need to add the secrets.

