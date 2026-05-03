# Next Steps: Repository Setup

**Date:** December 2025  
**Status:** ✅ **SCRIPTS READY**  
**Purpose:** Complete guide for setting up separate module repositories

---

## 📋 **Current Status**

✅ **Repositories Created:** 9/9 modules  
⏳ **Git Initialized:** 0/9 (requires Git installation)  
⏳ **GitHub Repositories:** 0/9 (pending creation)  
⏳ **CI/CD Secrets:** 0/9 (pending configuration)

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Review Repositories** ✅

All module repositories have been created in `./repositories/`:

- ✅ `repositories/payaid-core/`
- ✅ `repositories/payaid-crm/`
- ✅ `repositories/payaid-finance/`
- ✅ `repositories/payaid-hr/`
- ✅ `repositories/payaid-marketing/`
- ✅ `repositories/payaid-whatsapp/`
- ✅ `repositories/payaid-analytics/`
- ✅ `repositories/payaid-ai-studio/`
- ✅ `repositories/payaid-communication/`

**Verify:**
```bash
# List all repositories
ls repositories/
```

---

### **Step 2: Install Git** (if not installed)

**Windows:**
- Download: https://git-scm.com/download/win
- Install with default options
- Restart terminal/PowerShell

**macOS:**
```bash
# Using Homebrew
brew install git

# Or download from: https://git-scm.com/download/mac
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install git

# CentOS/RHEL
sudo yum install git
```

**Verify installation:**
```bash
git --version
```

---

### **Step 3: Initialize Git Repositories**

**Option A: Automated (Recommended)**

```bash
# Initialize all repositories
npx tsx scripts/setup-git-repositories.ts --init-only
```

**Option B: Manual (Per Module)**

```bash
# For each module
cd repositories/payaid-crm
git init
git add .
git commit -m "Initial commit: CRM module"
git branch -M main
cd ../..
```

**Repeat for all modules:**
- `payaid-core`
- `payaid-crm`
- `payaid-finance`
- `payaid-hr`
- `payaid-marketing`
- `payaid-whatsapp`
- `payaid-analytics`
- `payaid-ai-studio`
- `payaid-communication`

---

### **Step 4: Create GitHub Repositories**

**Option A: Using GitHub CLI (Recommended)**

1. **Install GitHub CLI:**
   - Windows: `winget install GitHub.cli`
   - macOS: `brew install gh`
   - Linux: https://cli.github.com/

2. **Authenticate:**
   ```bash
   gh auth login
   ```

3. **Create repositories:**
   ```bash
   ./scripts/create-github-repos.sh --org your-org-name
   ```

**Option B: Manual (GitHub Web)**

1. Go to: https://github.com/new
2. Create repositories:
   - `payaid-core`
   - `payaid-crm`
   - `payaid-finance`
   - `payaid-hr`
   - `payaid-marketing`
   - `payaid-whatsapp`
   - `payaid-analytics`
   - `payaid-ai-studio`
   - `payaid-communication`
3. **Don't** initialize with README, .gitignore, or license (already included)

---

### **Step 5: Configure Git Remotes**

**For each module:**

```bash
cd repositories/payaid-crm
git remote add origin https://github.com/your-org/payaid-crm.git
cd ../..
```

**Or use the automated script:**

```bash
# After creating GitHub repositories
./scripts/push-to-github.sh
```

---

### **Step 6: Push to GitHub**

**Option A: Automated**

```bash
# Push all repositories
./scripts/push-to-github.sh
```

**Option B: Manual (Per Module)**

```bash
cd repositories/payaid-crm
git push -u origin main
cd ../..
```

---

### **Step 7: Set Up CI/CD Secrets**

**See detailed guide:** `scripts/setup-cicd-secrets.md`

**Quick setup:**

1. **Get Vercel credentials:**
   - Token: https://vercel.com/account/tokens
   - Org ID: Vercel Dashboard → Settings → General
   - Project ID: Vercel Dashboard → Project Settings → General

2. **Add secrets to GitHub:**

   **Using GitHub Web:**
   - Go to repository → Settings → Secrets and variables → Actions
   - Add secrets:
     - `VERCEL_TOKEN`
     - `VERCEL_ORG_ID`
     - `VERCEL_PROJECT_ID`

   **Using GitHub CLI:**
   ```bash
   gh secret set VERCEL_TOKEN --repo your-org/payaid-crm --body "$VERCEL_TOKEN"
   gh secret set VERCEL_ORG_ID --repo your-org/payaid-crm --body "$VERCEL_ORG_ID"
   gh secret set VERCEL_PROJECT_ID --repo your-org/payaid-crm --body "$VERCEL_PROJECT_ID"
   ```

3. **Repeat for all modules**

---

## 📊 **Quick Status Check**

Run the complete setup script to check status:

```bash
npx tsx scripts/complete-repository-setup.ts --skip-github --skip-push
```

This will show:
- ✅ Which repositories exist
- ✅ Which have Git initialized
- ✅ Which have remotes configured
- ✅ Next steps needed

---

## 🔧 **Troubleshooting**

### **Git Not Found**

**Error:** `'git' is not recognized as an internal or external command`

**Solution:**
1. Install Git (see Step 2)
2. Restart terminal/PowerShell
3. Verify: `git --version`

### **GitHub CLI Not Found**

**Error:** `gh: command not found`

**Solution:**
1. Install GitHub CLI (see Step 4)
2. Authenticate: `gh auth login`

### **Remote Already Exists**

**Error:** `fatal: remote origin already exists`

**Solution:**
```bash
# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/your-org/payaid-crm.git
```

### **Push Rejected**

**Error:** `failed to push some refs`

**Solution:**
```bash
# Pull first (if repository has content)
git pull origin main --allow-unrelated-histories

# Or force push (if you're sure)
git push -u origin main --force
```

---

## ✅ **Checklist**

- [ ] Git installed and verified
- [ ] All repositories reviewed in `./repositories/`
- [ ] Git repositories initialized
- [ ] GitHub repositories created
- [ ] Git remotes configured
- [ ] Code pushed to GitHub
- [ ] CI/CD secrets configured
- [ ] GitHub Actions workflows verified

---

## 📚 **Scripts Available**

1. ✅ `scripts/setup-git-repositories.ts` - Initialize Git repositories
2. ✅ `scripts/create-github-repos.sh` - Create GitHub repositories (requires gh CLI)
3. ✅ `scripts/push-to-github.sh` - Push all repositories to GitHub
4. ✅ `scripts/complete-repository-setup.ts` - Complete setup orchestration
5. ✅ `scripts/setup-cicd-secrets.md` - CI/CD secrets guide

---

## 🎯 **Next Steps After Setup**

Once repositories are set up:

1. ✅ **Configure DNS** - See `scripts/setup-dns-records.md`
2. ✅ **Deploy to Staging** - `./scripts/deploy-staging.sh <module>`
3. ✅ **Test End-to-End** - `npx tsx scripts/test-end-to-end.ts --staging`
4. ✅ **Deploy to Production** - `./scripts/deploy-production.sh <module>`

---

## 📝 **Summary**

**Current Status:**
- ✅ Repository creation scripts ready
- ✅ Git initialization scripts ready
- ✅ GitHub repository creation scripts ready
- ✅ Push scripts ready
- ✅ CI/CD secrets guide ready

**Pending:**
- ⏳ Git installation (if not installed)
- ⏳ GitHub CLI installation (optional, for automation)
- ⏳ Manual execution of setup steps

**All scripts and guides are ready. Follow the steps above to complete the setup.**

---

**Status:** ✅ **SCRIPTS READY**  
**Next:** Install Git and follow setup steps above

