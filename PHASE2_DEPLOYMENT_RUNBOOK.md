# 🚀 Phase 2: Deployment Runbook

**Date:** December 2025  
**Status:** ✅ **READY FOR DEPLOYMENT**  
**Purpose:** Step-by-step deployment guide for staging and production

---

## 🎯 **Deployment Overview**

This guide covers deploying the modular architecture to staging and production environments.

---

## 📋 **Pre-Deployment Checklist**

### **1. Code Review** ✅
- [ ] All OAuth2 endpoints tested
- [ ] All module middleware tested
- [ ] All API routes migrated
- [ ] All frontend pages migrated
- [ ] Integration tests passing
- [ ] No linting errors
- [ ] No TypeScript errors

### **2. Environment Setup** ✅
- [ ] Database migrations run
- [ ] Redis configured
- [ ] Environment variables set
- [ ] DNS configured for subdomains
- [ ] SSL certificates ready

### **3. Infrastructure** ✅
- [ ] Servers provisioned
- [ ] Load balancers configured
- [ ] CDN configured (if using)
- [ ] Monitoring set up
- [ ] Logging configured

---

## 🏗️ **Staging Deployment**

### **Step 1: Prepare Staging Environment**

**1.1 Set Up Subdomains:**
```
staging.payaid.io          → Core module
crm.staging.payaid.io      → CRM module
invoicing.staging.payaid.io → Invoicing module
accounting.staging.payaid.io → Accounting module
hr.staging.payaid.io       → HR module
whatsapp.staging.payaid.io → WhatsApp module
analytics.staging.payaid.io → Analytics module
```

**1.2 Configure DNS:**
```dns
Type    Name                      Value
A       staging.payaid.io         → Staging Server IP
CNAME   *.staging.payaid.io      → staging.payaid.io
```

**1.3 Environment Variables:**

**Core Module (.env):**
```env
NODE_ENV=staging
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=staging-jwt-secret
NEXT_PUBLIC_APP_URL=https://staging.payaid.io
```

**CRM Module (.env):**
```env
NODE_ENV=staging
DATABASE_URL=postgresql://...
CORE_AUTH_URL=https://staging.payaid.io
OAUTH_CLIENT_ID=crm-module
OAUTH_CLIENT_SECRET=staging-secret
NEXT_PUBLIC_APP_URL=https://crm.staging.payaid.io
```

---

### **Step 2: Deploy Core Module**

**2.1 Build:**
```bash
cd .
npm run build
```

**2.2 Deploy:**
```bash
# Using Vercel
vercel deploy --prod --env staging

# Or using Docker
docker build -t payaid-core:staging .
docker run -d -p 3000:3000 --env-file .env.staging payaid-core:staging
```

**2.3 Verify:**
```bash
# Health check
curl https://staging.payaid.io/api/health

# OAuth endpoints
curl https://staging.payaid.io/api/oauth/authorize?client_id=test&redirect_uri=https://crm.staging.payaid.io/api/oauth/callback&response_type=code
```

---

### **Step 3: Deploy Modules**

**3.1 Deploy CRM Module:**
```bash
cd crm-module
npm run build
vercel deploy --prod --env staging
# Or docker build and run
```

**3.2 Deploy Remaining Modules:**
Repeat for each module:
- Invoicing
- Accounting
- HR
- WhatsApp
- Analytics

**3.3 Verify Each Module:**
```bash
# Test OAuth callback
curl https://crm.staging.payaid.io/api/oauth/callback

# Test API route (should redirect to auth)
curl https://crm.staging.payaid.io/api/contacts
```

---

### **Step 4: Integration Testing**

**4.1 Test OAuth2 Flow:**
1. Navigate to `https://crm.staging.payaid.io`
2. Should redirect to `https://staging.payaid.io/login`
3. Login
4. Should redirect back with token
5. Should access CRM module

**4.2 Test Cross-Module Navigation:**
1. Login to CRM module
2. Navigate to Invoicing module
3. Should not require re-login
4. Token should be reused

**4.3 Test License Checking:**
1. Login with tenant without CRM license
2. Try to access CRM module
3. Should return 403 or redirect to upgrade

---

## 🚀 **Production Deployment**

### **Step 1: Pre-Production Checklist**

- [ ] All staging tests passing
- [ ] Performance acceptable (<200ms API response)
- [ ] No critical bugs
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] Team briefed

---

### **Step 2: Deploy Core Module**

**2.1 Blue-Green Deployment:**
```bash
# Deploy to green environment
vercel deploy --prod --env production

# Test green environment
curl https://green.payaid.io/api/health

# Switch DNS to green
# Monitor for 1 hour

# If issues, switch back to blue
```

**2.2 Gradual Rollout:**
```bash
# Deploy to 10% of traffic
# Monitor for 1 hour
# Increase to 50%
# Monitor for 2 hours
# Increase to 100%
```

---

### **Step 3: Deploy Modules**

**3.1 Deploy One Module at a Time:**
```bash
# 1. Deploy CRM module
cd crm-module
vercel deploy --prod

# 2. Monitor for 1 hour
# 3. Deploy next module
```

**3.2 Verify Each Deployment:**
- [ ] Health checks passing
- [ ] OAuth2 flow working
- [ ] API routes responding
- [ ] No errors in logs
- [ ] Performance acceptable

---

### **Step 4: Post-Deployment**

**4.1 Monitor:**
- [ ] Error rates (<0.1%)
- [ ] Response times (<200ms p95)
- [ ] Uptime (99.9%+)
- [ ] User activity
- [ ] Database performance

**4.2 Validate:**
- [ ] All workflows working
- [ ] All API endpoints working
- [ ] License checking working
- [ ] Cross-module navigation working
- [ ] Token refresh working

---

## 🔄 **Rollback Procedure**

### **If Issues Detected:**

**1. Immediate Rollback:**
```bash
# Switch DNS back to previous version
# Or use Vercel rollback
vercel rollback
```

**2. Investigate:**
- Check error logs
- Check database connections
- Check Redis connections
- Check OAuth2 flow

**3. Fix and Redeploy:**
- Fix issues
- Test in staging
- Redeploy to production

---

## 📊 **Monitoring & Alerts**

### **Key Metrics to Monitor:**

1. **API Response Times:**
   - Target: <200ms p95
   - Alert if: >500ms p95

2. **Error Rates:**
   - Target: <0.1%
   - Alert if: >1%

3. **OAuth2 Success Rate:**
   - Target: >99%
   - Alert if: <95%

4. **Database Performance:**
   - Target: <100ms query time
   - Alert if: >500ms

5. **Uptime:**
   - Target: 99.9%
   - Alert if: <99%

---

## 🧪 **Post-Deployment Testing**

### **Smoke Tests:**

```bash
# 1. Core health
curl https://payaid.io/api/health

# 2. OAuth authorize
curl "https://payaid.io/api/oauth/authorize?client_id=test&redirect_uri=https://crm.payaid.io/api/oauth/callback&response_type=code"

# 3. Module health
curl https://crm.payaid.io/api/health

# 4. API route (should require auth)
curl https://crm.payaid.io/api/contacts
```

---

## 📝 **Deployment Checklist**

### **Before Deployment:**
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Environment variables set
- [ ] DNS configured
- [ ] SSL certificates ready
- [ ] Monitoring configured
- [ ] Rollback plan ready

### **During Deployment:**
- [ ] Deploy core module
- [ ] Verify core module
- [ ] Deploy modules one by one
- [ ] Verify each module
- [ ] Test OAuth2 flow
- [ ] Test cross-module navigation

### **After Deployment:**
- [ ] Monitor metrics
- [ ] Check error logs
- [ ] Validate functionality
- [ ] Test with real users
- [ ] Document issues
- [ ] Schedule post-mortem

---

## 🎯 **Success Criteria**

Deployment is successful when:
- ✅ All modules deployed
- ✅ OAuth2 SSO working
- ✅ Cross-module navigation seamless
- ✅ License checking enforced
- ✅ Performance acceptable
- ✅ No critical errors
- ✅ Uptime >99.9%

---

**Status:** ✅ **READY FOR DEPLOYMENT**  
**Next:** Deploy to staging, test, then deploy to production

