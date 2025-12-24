# CI/CD Secrets Setup Guide

**Date:** December 2025  
**Purpose:** Configure CI/CD secrets for GitHub Actions

---

## 🔐 **Required Secrets**

Each module repository needs the following secrets configured in GitHub Actions:

### **Vercel Deployment**

1. **VERCEL_TOKEN**
   - Get from: https://vercel.com/account/tokens
   - Create new token with full access
   - Add to: Repository Settings → Secrets → Actions → New repository secret

2. **VERCEL_ORG_ID**
   - Get from: Vercel Dashboard → Settings → General
   - Organization ID (found in URL or settings)
   - Add to: Repository Settings → Secrets → Actions → New repository secret

3. **VERCEL_PROJECT_ID**
   - Get from: Vercel Dashboard → Project Settings → General
   - Project ID (found in settings)
   - Add to: Repository Settings → Secrets → Actions → New repository secret

---

## 📋 **Setup Steps**

### **Option 1: Manual Setup (GitHub Web)**

1. Go to repository: `https://github.com/your-org/payaid-<module>`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `VERCEL_TOKEN`
   - Value: `<your-token>`
   - Click **Add secret**
5. Repeat for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`

### **Option 2: GitHub CLI**

```bash
# Set secrets for a repository
gh secret set VERCEL_TOKEN --repo your-org/payaid-crm --body "$(cat vercel-token.txt)"
gh secret set VERCEL_ORG_ID --repo your-org/payaid-crm --body "your-org-id"
gh secret set VERCEL_PROJECT_ID --repo your-org/payaid-crm --body "your-project-id"
```

### **Option 3: Bulk Setup Script**

```bash
# Set secrets for all repositories
for module in core crm finance hr marketing whatsapp analytics ai-studio communication; do
  gh secret set VERCEL_TOKEN --repo your-org/payaid-$module --body "$VERCEL_TOKEN"
  gh secret set VERCEL_ORG_ID --repo your-org/payaid-$module --body "$VERCEL_ORG_ID"
  gh secret set VERCEL_PROJECT_ID --repo your-org/payaid-$module --body "$VERCEL_PROJECT_ID"
done
```

---

## 🔄 **Alternative: Environment-Specific Secrets**

### **Staging Environment**

```bash
gh secret set VERCEL_TOKEN_STAGING --repo your-org/payaid-crm --body "$VERCEL_TOKEN"
gh secret set VERCEL_ORG_ID_STAGING --repo your-org/payaid-crm --body "$VERCEL_ORG_ID"
gh secret set VERCEL_PROJECT_ID_STAGING --repo your-org/payaid-crm --body "$VERCEL_PROJECT_ID_STAGING"
```

### **Production Environment**

```bash
gh secret set VERCEL_TOKEN_PROD --repo your-org/payaid-crm --body "$VERCEL_TOKEN_PROD"
gh secret set VERCEL_ORG_ID_PROD --repo your-org/payaid-crm --body "$VERCEL_ORG_ID"
gh secret set VERCEL_PROJECT_ID_PROD --repo your-org/payaid-crm --body "$VERCEL_PROJECT_ID_PROD"
```

---

## ✅ **Verification**

### **Check Secrets**

```bash
# List secrets for a repository
gh secret list --repo your-org/payaid-crm
```

### **Test Workflow**

1. Make a small change to repository
2. Commit and push
3. Check GitHub Actions tab
4. Verify workflow runs successfully

---

## 🔒 **Security Best Practices**

1. **Use Organization Secrets** (if available)
   - Set secrets at organization level
   - Inherit in repositories
   - Easier to manage

2. **Rotate Secrets Regularly**
   - Update tokens every 90 days
   - Revoke old tokens

3. **Limit Token Permissions**
   - Only grant necessary permissions
   - Use least privilege principle

4. **Audit Secret Access**
   - Review who has access
   - Monitor secret usage

---

## 📝 **Module-Specific Configuration**

### **Core Module**

Additional secrets might be needed:
- `DATABASE_URL` - Database connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `OAUTH_CLIENT_SECRET` - OAuth2 client secret

### **Module Repositories**

Additional secrets:
- `CORE_AUTH_URL` - Core module URL (usually same for all)
- `DATABASE_URL` - Database connection string
- `OAUTH_CLIENT_SECRET` - Module-specific OAuth2 secret

---

## 🚀 **Next Steps**

After setting up secrets:

1. ✅ Verify secrets are configured
2. ✅ Test workflow with a test commit
3. ✅ Configure branch protection rules
4. ✅ Set up deployment environments
5. ✅ Configure DNS and SSL
6. ✅ Deploy to staging

---

**Status:** ⏳ **READY FOR CONFIGURATION**  
**Next:** Configure secrets in GitHub repositories

