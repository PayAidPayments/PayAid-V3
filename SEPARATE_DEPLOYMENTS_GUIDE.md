# Separate Deployments Guide

**Date:** December 2025  
**Status:** ✅ **READY FOR DEPLOYMENT**  
**Purpose:** Complete guide for deploying modules separately

---

## 🎯 **Overview**

This guide walks you through deploying PayAid modules as separate, independent services. Each module can be deployed to its own subdomain and scaled independently.

---

## 📋 **Prerequisites**

- ✅ Module repositories created
- ✅ GitHub account with repositories
- ✅ DNS provider access (Cloudflare, Route 53, etc.)
- ✅ Hosting provider (Vercel, AWS, etc.)
- ✅ Environment variables configured

---

## 🚀 **Step 1: Create Separate Repositories**

### **Option A: Create All Repositories**

```bash
# Create all module repositories at once
npx tsx scripts/create-all-repositories.ts
```

### **Option B: Create Individual Repository**

```bash
# Create a specific module repository
npx tsx scripts/create-module-repository.ts <module-name>

# Examples:
npx tsx scripts/create-module-repository.ts crm
npx tsx scripts/create-module-repository.ts finance
npx tsx scripts/create-module-repository.ts hr
```

### **Available Modules**

- `core` - Core platform module
- `crm` - CRM module
- `finance` - Finance module
- `hr` - HR module
- `marketing` - Marketing module
- `whatsapp` - WhatsApp module
- `analytics` - Analytics module
- `ai-studio` - AI Studio module
- `communication` - Communication module

---

## 📦 **Step 2: Initialize Git Repositories**

For each module repository:

```bash
cd repositories/payaid-<module-name>

# Initialize git
git init
git add .
git commit -m "Initial commit: <Module Name> module"

# Create GitHub repository (via GitHub web interface or CLI)
gh repo create payaid-<module-name> --public

# Add remote and push
git remote add origin https://github.com/your-org/payaid-<module-name>.git
git branch -M main
git push -u origin main
```

---

## ⚙️ **Step 3: Set Up CI/CD Pipelines**

### **GitHub Actions**

Each repository includes a `.github/workflows/deploy.yml` file. Configure secrets:

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `VERCEL_TOKEN` - Vercel API token
   - `VERCEL_ORG_ID` - Vercel organization ID
   - `VERCEL_PROJECT_ID` - Vercel project ID

### **Alternative: Manual Deployment**

If not using Vercel, update the workflow file for your hosting provider:

```yaml
# Example: AWS ECS deployment
- name: Deploy to AWS ECS
  uses: aws-actions/amazon-ecs-deploy-task-definition@v1
  with:
    task-definition: task-definition.json
    service: payaid-crm
    cluster: payaid-cluster
```

---

## 🌐 **Step 4: Configure DNS Records**

### **Quick Setup**

See `scripts/setup-dns-records.md` for detailed instructions.

### **Summary**

Add CNAME records for each subdomain:

```
crm.payaid.io → payaid.io
finance.payaid.io → payaid.io
hr.payaid.io → payaid.io
marketing.payaid.io → payaid.io
whatsapp.payaid.io → payaid.io
analytics.payaid.io → payaid.io
ai.payaid.io → payaid.io
communication.payaid.io → payaid.io
```

### **Provider-Specific**

- **Cloudflare:** DNS → Records → Add CNAME
- **AWS Route 53:** Hosted Zones → Create Record Set
- **Google Domains:** DNS → Custom resource records

---

## 🔐 **Step 5: Configure Environment Variables**

### **Core Module**

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
OAUTH_CLIENT_ID=core
OAUTH_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=https://payaid.io
```

### **Module (CRM Example)**

```env
CORE_AUTH_URL=https://payaid.io
OAUTH_CLIENT_ID=crm
OAUTH_CLIENT_SECRET=...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://crm.payaid.io
NEXT_PUBLIC_USE_SUBDOMAINS=true
NODE_ENV=production
```

### **Set in Hosting Provider**

- **Vercel:** Project Settings → Environment Variables
- **AWS:** ECS Task Definition → Environment Variables
- **Docker:** `.env` file or environment variables

---

## 🚀 **Step 6: Deploy to Staging**

### **Using Script**

```bash
# Deploy specific module to staging
./scripts/deploy-staging.sh crm
```

### **Manual Deployment**

```bash
cd repositories/payaid-crm

# Install dependencies
npm install

# Build
npm run build

# Deploy (example: Vercel)
vercel --env .env.staging
```

---

## 🧪 **Step 7: Test End-to-End**

### **Run Test Suite**

```bash
# Test staging environment
npx tsx scripts/test-end-to-end.ts --staging

# Test production environment
npx tsx scripts/test-end-to-end.ts --production
```

### **Manual Testing**

1. **Test Module Accessibility**
   - Visit `https://crm-staging.payaid.io`
   - Should redirect to login or show module

2. **Test OAuth2 SSO**
   - Log in at core module
   - Navigate to CRM module
   - Should be automatically authenticated

3. **Test Cross-Module Navigation**
   - Navigate between modules
   - Verify OAuth2 SSO works
   - Check license enforcement

---

## 🎯 **Step 8: Deploy to Production**

### **Using Script**

```bash
# Deploy specific module to production
./scripts/deploy-production.sh crm
```

### **Manual Deployment**

```bash
cd repositories/payaid-crm

# Ensure on main branch
git checkout main
git pull origin main

# Build
npm run build

# Run tests
npm test

# Deploy (example: Vercel)
vercel --prod --env .env.production
```

---

## 🐳 **Alternative: Docker Deployment**

### **Build Image**

```bash
cd repositories/payaid-crm
docker build -t payaid-crm .
```

### **Run Container**

```bash
docker run -p 3001:3001 \
  -e CORE_AUTH_URL=https://payaid.io \
  -e DATABASE_URL=postgresql://... \
  -e OAUTH_CLIENT_ID=crm \
  -e OAUTH_CLIENT_SECRET=... \
  payaid-crm
```

### **Docker Compose**

```bash
cd repositories/payaid-crm
docker-compose up -d
```

---

## ☸️ **Alternative: Kubernetes Deployment**

### **Apply Configuration**

```bash
kubectl apply -f repositories/payaid-crm/k8s/
```

### **Verify Deployment**

```bash
kubectl get deployments
kubectl get services
kubectl get ingress
```

---

## 📊 **Monitoring & Logging**

### **Set Up Monitoring**

- **Application Monitoring:** Sentry, Datadog, New Relic
- **Infrastructure Monitoring:** CloudWatch, Grafana
- **Log Aggregation:** ELK Stack, CloudWatch Logs

### **Key Metrics**

- Response times
- Error rates
- OAuth2 SSO success rate
- Module license checks
- Database query performance

---

## 🔄 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Repository created and pushed to GitHub
- [ ] CI/CD pipeline configured
- [ ] DNS records configured
- [ ] SSL certificates provisioned
- [ ] Environment variables set
- [ ] Database migrations run

### **Staging Deployment**
- [ ] Deploy to staging
- [ ] Run end-to-end tests
- [ ] Verify OAuth2 SSO
- [ ] Test cross-module navigation
- [ ] Check error logs
- [ ] Verify performance

### **Production Deployment**
- [ ] Deploy to production
- [ ] Run end-to-end tests
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify SSL certificates
- [ ] Test OAuth2 SSO
- [ ] Verify license enforcement

---

## 🆘 **Troubleshooting**

### **Module Not Accessible**

1. Check DNS propagation: `dig crm.payaid.io`
2. Verify SSL certificate: `openssl s_client -connect crm.payaid.io:443`
3. Check hosting provider logs
4. Verify environment variables

### **OAuth2 SSO Not Working**

1. Verify `CORE_AUTH_URL` is correct
2. Check `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET`
3. Verify callback URL matches configuration
4. Check core module OAuth2 endpoints

### **License Checks Failing**

1. Verify JWT_SECRET matches core module
2. Check database connection
3. Verify license data in database
4. Check module ID matches configuration

---

## 📝 **Next Steps**

1. ✅ Create all module repositories
2. ✅ Set up CI/CD pipelines
3. ✅ Configure DNS records
4. ✅ Deploy to staging
5. ✅ Test end-to-end
6. ✅ Deploy to production
7. ⏳ Monitor and optimize

---

## 📚 **Additional Resources**

- `DEPLOYMENT_INFRASTRUCTURE.md` - Infrastructure details
- `scripts/setup-dns-records.md` - DNS configuration
- `scripts/deploy-staging.sh` - Staging deployment script
- `scripts/deploy-production.sh` - Production deployment script
- `scripts/test-end-to-end.ts` - End-to-end test suite

---

**Status:** ✅ **READY FOR DEPLOYMENT**  
**Next:** Follow steps above to deploy modules separately

