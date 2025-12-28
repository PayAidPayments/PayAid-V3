# GitGuardian Remediation Guide

## 🔍 Current Status

✅ **Secrets Removed from Codebase**
- All exposed secrets have been sanitized in the current codebase
- Files now use placeholders like `[YOUR-PASSWORD]`, `[YOUR-API-KEY]`

⚠️ **Important**: Secrets still exist in **git history**, which is why GitGuardian still shows them as incidents.

---

## 📋 Step-by-Step Remediation

### **Step 1: Commit and Push Changes**

First, commit the sanitized files:

```bash
# Stage all the sanitized files
git add SUPABASE_*.md GOOGLE_AI_STUDIO_SETUP.md scripts/test-payaid-connection.ts scripts/add-payaid-credentials.ts test-db-connection.js PAYAID_*.md ADMIN_*.md SECURE_*.md SETUP_*.md Payaidpayments_v2_Nodejs_v6.11.0-1/**/*.js

# Commit with a clear message
git commit -m "security: sanitize exposed secrets in documentation files"

# Push to remote
git push origin main
```

**Note**: Replace `main` with your default branch name if different.

---

### **Step 2: GitGuardian Automatic Rescan**

GitGuardian automatically rescans your repository when you push changes. This usually happens within:
- **5-15 minutes** for new commits
- **24 hours** for full historical scans

**What happens:**
- GitGuardian will detect that secrets are no longer in the current codebase
- New incidents should stop appearing
- **However**, historical incidents may still show because secrets exist in git history

---

### **Step 3: Mark Incidents as Resolved (GitGuardian Dashboard)**

1. **Go to GitGuardian Dashboard:**
   - Visit: https://dashboard.gitguardian.com
   - Navigate to your repository: `PayAidPayments/PayAid-V3`

2. **For Each Incident:**
   - Click on the incident
   - Look for **"Resolve"** or **"Mark as Resolved"** button
   - Select reason: **"Secret removed from codebase"**
   - Add note: "Secrets sanitized and replaced with placeholders"

3. **Bulk Actions** (if available):
   - Select multiple incidents
   - Use bulk resolve option
   - Mark all as "Secret removed from codebase"

---

### **Step 4: Clean Git History (Recommended for Complete Removal)**

⚠️ **Warning**: This rewrites git history. Coordinate with your team before doing this!

#### **Option A: Using git-filter-repo (Recommended)**

```bash
# Install git-filter-repo (if not installed)
# Windows: pip install git-filter-repo
# Mac/Linux: pip3 install git-filter-repo

# Remove secrets from all history
git filter-repo --path SUPABASE_POOLER_SETUP.md --invert-paths
git filter-repo --path SUPABASE_CONFIGURATION_STATUS.md --invert-paths
git filter-repo --path SUPABASE_CONNECTION_STATUS.md --invert-paths
git filter-repo --path SUPABASE_CONNECTION_TROUBLESHOOTING.md --invert-paths
git filter-repo --path GOOGLE_AI_STUDIO_SETUP.md --invert-paths
git filter-repo --path scripts/test-payaid-connection.ts --invert-paths
git filter-repo --path scripts/add-payaid-credentials.ts --invert-paths
git filter-repo --path test-db-connection.js --invert-paths
git filter-repo --path "Payaidpayments_v2_Nodejs_v6.11.0-1" --invert-paths

# Or remove specific secrets from all files
git filter-repo --replace-text <(echo 'x7RV7sVVfFvxApQ@8==>[YOUR-PASSWORD]')
git filter-repo --replace-text <(echo 'AIzaSyCBViUq8bVuLVGN2gmpVqldYu-bbFybMiM==>[YOUR-API-KEY]')
git filter-repo --replace-text <(echo '9306f7fd-57c4-409d-807d-2c23cb4a0212==>[YOUR-API-KEY]')
git filter-repo --replace-text <(echo 'a64c89fea6c404275bcf5bd59d592c4878ae4d45==>[YOUR-SALT]')
git filter-repo --replace-text <(echo '9b62ff8e-f03b-1587-afds-b630edad99df==>[YOUR-API-KEY]')
git filter-repo --replace-text <(echo '18e6063d4105erdsee9132wer6be8dbf237a6c15ed==>[YOUR-SALT]')

# Force push (WARNING: This rewrites history!)
git push origin --force --all
git push origin --force --tags
```

#### **Option B: Using BFG Repo-Cleaner**

```bash
# Download BFG: https://rtyley.github.io/bfg-repo-cleaner/

# Create a file with secrets to remove (secrets.txt)
echo 'x7RV7sVVfFvxApQ@8' > secrets.txt
echo 'AIzaSyCBViUq8bVuLVGN2gmpVqldYu-bbFybMiM' >> secrets.txt
echo '9306f7fd-57c4-409d-807d-2c23cb4a0212' >> secrets.txt
echo 'a64c89fea6c404275bcf5bd59d592c4878ae4d45' >> secrets.txt
echo '9b62ff8e-f03b-1587-afds-b630edad99df' >> secrets.txt
echo '18e6063d4105erdsee9132wer6be8dbf237a6c15ed' >> secrets.txt

# Clean history
java -jar bfg.jar --replace-text secrets.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

---

### **Step 5: Request Manual Rescan (If Needed)**

If GitGuardian doesn't automatically rescan:

1. **GitGuardian Dashboard:**
   - Go to your repository settings
   - Look for **"Trigger Scan"** or **"Rescan Repository"** button
   - Click to manually trigger a scan

2. **GitGuardian API** (if you have access):
   ```bash
   curl -X POST "https://api.gitguardian.com/v1/repos/{repo_id}/scan" \
     -H "Authorization: Token YOUR_API_TOKEN"
   ```

3. **Contact GitGuardian Support:**
   - Email: support@gitguardian.com
   - Request a manual rescan of your repository
   - Mention that you've removed secrets from the codebase

---

### **Step 6: Rotate All Exposed Credentials** ⚠️ CRITICAL

**Even after cleaning git history, you MUST rotate all exposed credentials:**

1. **Supabase Database:**
   - Go to Supabase Dashboard → Settings → Database
   - Change database password
   - Update `.env` with new password

2. **Google AI Studio:**
   - Go to https://aistudio.google.com/app/apikey
   - Revoke the exposed API key
   - Create a new API key
   - Update `.env` with new key

3. **PayAid Payments:**
   - Contact PayAid Payments support
   - Request new API keys and salts
   - Update `.env` with new credentials

---

## 🔒 Prevention for Future

### **1. Pre-commit Hooks**

Install GitGuardian pre-commit hook:

```bash
# Install ggshield
pip install ggshield

# Install pre-commit hook
ggshield install -m local
```

### **2. Add to .gitignore**

Ensure sensitive files are ignored (already done ✅):
```
.env
.env*.local
*.md (consider adding documentation files with examples)
```

### **3. Use Environment Variables**

✅ Already implemented - all secrets are in `.env` file

### **4. Code Review**

- Review all commits before merging
- Use GitGuardian's pre-commit hooks
- Never commit real credentials, even in documentation

---

## 📊 Verification Checklist

After completing the steps:

- [ ] All secrets sanitized in codebase
- [ ] Changes committed and pushed
- [ ] GitGuardian rescanned (wait 5-15 minutes)
- [ ] Historical incidents marked as resolved
- [ ] Git history cleaned (optional but recommended)
- [ ] All exposed credentials rotated
- [ ] `.env` updated with new credentials
- [ ] Pre-commit hooks installed
- [ ] Team notified of credential rotation

---

## 🆘 If Issues Persist

1. **Check GitGuardian Dashboard:**
   - Verify incidents are marked as resolved
   - Check if new scans show the secrets are gone

2. **Verify Git History:**
   ```bash
   # Search git history for secrets
   git log -p | grep -i "x7RV7sVVfFvxApQ"
   git log -p | grep -i "AIzaSyCBViUq8bVuLVGN2gmpVqldYu-bbFybMiM"
   ```

3. **Contact GitGuardian Support:**
   - If incidents don't clear after 24 hours
   - If you need help with git history cleanup
   - If you have questions about the remediation process

---

## 📝 Summary

**Quick Actions:**
1. ✅ Commit sanitized files
2. ✅ Push to remote
3. ✅ Wait for GitGuardian auto-rescan (5-15 min)
4. ✅ Mark incidents as resolved in dashboard
5. ⚠️ Rotate all exposed credentials
6. 🔧 (Optional) Clean git history for complete removal

**Remember**: Even if you clean git history, the secrets were exposed publicly, so **rotation is mandatory** for security.

---

**Last Updated**: December 2024  
**Status**: Secrets sanitized, awaiting GitGuardian rescan

