# Git Setup Guide for Vercel Deployment

**Date:** January 2026  
**Purpose:** Initialize git repository and prepare for Vercel deployment

---

## 🚀 **QUICK SETUP**

### **Step 1: Initialize Git Repository**

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: PayAid V3 with Financial Dashboard Module"
```

---

### **Step 2: Create GitHub Repository**

1. **Go to GitHub:**
   - Visit: https://github.com/new
   - Sign in to your account

2. **Create New Repository:**
   - Repository name: `payaid-v3` (or your preferred name)
   - Description: "PayAid V3 - Complete Business Management Platform"
   - Visibility: Private (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. **Copy Repository URL:**
   - HTTPS: `https://github.com/your-username/payaid-v3.git`
   - SSH: `git@github.com:your-username/payaid-v3.git`

---

### **Step 3: Connect and Push**

```bash
# Add remote repository
git remote add origin https://github.com/your-username/payaid-v3.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## 📋 **DETAILED STEPS**

### **1. Check Current Status**

```bash
# Check if git is initialized
git status
```

If you see "not a git repository", proceed with initialization.

---

### **2. Initialize Git Repository**

```bash
# Initialize git
git init

# Check status
git status
```

---

### **3. Configure Git (If First Time)**

```bash
# Set your name
git config --global user.name "Your Name"

# Set your email
git config --global user.email "your.email@example.com"
```

---

### **4. Stage All Files**

```bash
# Add all files
git add .

# Check what will be committed
git status
```

**Note:** Files in `.gitignore` will be automatically excluded.

---

### **5. Create Initial Commit**

```bash
# Create commit
git commit -m "Initial commit: PayAid V3 with Financial Dashboard Module

- Complete Financial Dashboard Module (Module 1.3)
- Prisma client generated
- Vercel configuration ready
- All core modules implemented
- Ready for production deployment"
```

---

### **6. Create GitHub Repository**

1. Go to: https://github.com/new
2. Fill in repository details
3. Click "Create repository"
4. **DO NOT** initialize with any files

---

### **7. Connect Local Repository to GitHub**

```bash
# Add remote (replace with your repository URL)
git remote add origin https://github.com/your-username/payaid-v3.git

# Verify remote
git remote -v
```

---

### **8. Push to GitHub**

```bash
# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

You may be prompted for GitHub credentials. Use:
- Personal Access Token (recommended)
- Or GitHub username/password

---

## 🔐 **GITHUB AUTHENTICATION**

### **Option 1: Personal Access Token (Recommended)**

1. **Create Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name: "PayAid V3 Deployment"
   - Select scopes: `repo` (full control)
   - Click "Generate token"
   - **Copy the token** (you won't see it again)

2. **Use Token:**
   - When prompted for password, paste the token
   - Username: your GitHub username

### **Option 2: SSH Key**

1. **Generate SSH Key:**
   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   ```

2. **Add to GitHub:**
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste key and save

3. **Use SSH URL:**
   ```bash
   git remote set-url origin git@github.com:your-username/payaid-v3.git
   ```

---

## ✅ **VERIFICATION**

After pushing, verify:

1. **Check GitHub:**
   - Visit your repository on GitHub
   - Verify all files are present
   - Check commit history

2. **Verify Remote:**
   ```bash
   git remote -v
   ```

3. **Check Status:**
   ```bash
   git status
   ```

---

## 📝 **NEXT STEPS AFTER GIT SETUP**

Once git is set up and pushed to GitHub:

1. **Deploy to Vercel:**
   - Go to Vercel Dashboard
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

2. **Apply Database Schema:**
   - Run migrations or `prisma db push`

3. **Run Deployment Script:**
   - `npx tsx scripts/deploy-financial-dashboard.ts`

---

## 🐛 **TROUBLESHOOTING**

### **"fatal: not a git repository"**
- Run `git init` first

### **"remote origin already exists"**
- Remove existing remote: `git remote remove origin`
- Add new remote: `git remote add origin <url>`

### **"Authentication failed"**
- Use Personal Access Token instead of password
- Or set up SSH key

### **"Large files"**
- Check `.gitignore` is working
- Remove large files: `git rm --cached <file>`

---

**Status:** ✅ **Ready for Git Setup**

**Next Action:** Run the commands above to initialize git and push to GitHub.
