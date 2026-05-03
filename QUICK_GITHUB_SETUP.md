# Quick GitHub Setup Guide

**Date:** December 2025  
**Status:** ✅ **READY TO EXECUTE**

---

## 🚀 **Quick Start**

### **PowerShell (Windows)**

```powershell
# Run the setup script
.\scripts\quick-github-setup.ps1 -OrgName "your-github-org-or-username"
```

**Example:**
```powershell
.\scripts\quick-github-setup.ps1 -OrgName "payaid"
```

**For private repositories:**
```powershell
.\scripts\quick-github-setup.ps1 -OrgName "payaid" -Private
```

---

## 📋 **What the Script Does**

1. ✅ Creates GitHub repositories for all 9 modules
2. ✅ Initializes Git repositories (if not already done)
3. ✅ Configures Git remotes with token authentication
4. ✅ Pushes code to GitHub
5. ✅ Provides next steps

---

## 🔐 **Security Note**

⚠️ **The token is embedded in the script for convenience, but:**
- The script uses the token only for API calls
- The token is not committed to git (already in `.gitignore`)
- After setup, consider rotating the token
- For production, use GitHub Secrets instead

---

## ✅ **After Running**

1. **Verify repositories:**
   - Go to: https://github.com/your-org-name
   - You should see 9 repositories: `payaid-core`, `payaid-crm`, etc.

2. **Set up CI/CD secrets:**
   - See: `scripts/setup-cicd-secrets.md`
   - Add secrets to each repository

3. **Configure branch protection:**
   - Go to repository → Settings → Branches
   - Add rule for `main` branch

4. **Set up deployment:**
   - Follow: `SEPARATE_DEPLOYMENTS_GUIDE.md`

---

## 🆘 **Troubleshooting**

### **"Organization not found"**

- Make sure `OrgName` matches your GitHub organization or username exactly
- Check: https://github.com/settings/organizations

### **"Repository already exists"**

- This is okay - the script will skip creation and continue
- It will still configure remotes and push

### **"Push failed"**

- Repository might be empty on GitHub
- Try: `git pull origin main --allow-unrelated-histories` first
- Or force push: `git push -u origin main --force` (if you're sure)

### **"Git not found"**

- Install Git: https://git-scm.com/download/win
- Restart PowerShell after installation

---

## 📝 **Manual Alternative**

If the script doesn't work, you can do it manually:

```powershell
# For each module
cd repositories\payaid-crm
git init
git add .
git commit -m "Initial commit: CRM module"
git branch -M main
git remote add origin https://YOUR_GITHUB_TOKEN@github.com/your-org/payaid-crm.git
```

**⚠️ Replace `YOUR_GITHUB_TOKEN` with your actual token from:** https://github.com/settings/tokens
git push -u origin main
cd ..\..
```

---

**Status:** ✅ **READY TO EXECUTE**  
**Next:** Run `.\scripts\quick-github-setup.ps1 -OrgName "your-org"`

