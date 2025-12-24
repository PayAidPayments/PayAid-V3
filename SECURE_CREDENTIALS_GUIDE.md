# Secure Credentials Management Guide

**SECURITY:** Admin PayAid Payments credentials setup and access control

---

## 🔐 **Admin Credentials**

### **Credentials (Admin Team Only)**
```
API Key: 9306f7fd-57c4-409d-807d-2c23cb4a0212
SALT:    a64c89fea6c404275bcf5bd59d592c4878ae4d45
Base URL: https://api.payaidpayments.com
```

**Usage:** Platform-level payments only (subscriptions, module purchases)

---

## 🔒 **Security Implementation**

### **1. Environment Variables**
✅ Credentials stored in `.env` file (not in code)  
✅ `.env` file is gitignored  
✅ Never exposed to client-side code  
✅ Never logged or displayed

### **2. Access Control**
✅ Only accessible to admin/owner users  
✅ Tenants cannot view admin credentials  
✅ Each tenant configures their own credentials

### **3. Usage Separation**
- **Admin Credentials:** Platform payments (subscriptions, app store)
- **Tenant Credentials:** Tenant invoice payments (configured separately)

---

## 📋 **Setup Instructions**

### **Step 1: Add to `.env` File**

```env
# Admin PayAid Payments Credentials (Platform Payments Only)
# SECURITY: Admin Team Only - Never share with tenants
PAYAID_ADMIN_API_KEY="9306f7fd-57c4-409d-807d-2c23cb4a0212"
PAYAID_ADMIN_SALT="a64c89fea6c404275bcf5bd59d592c4878ae4d45"
PAYAID_PAYMENTS_BASE_URL="https://api.payaidpayments.com"
PAYAID_PAYMENTS_PG_API_URL="https://api.payaidpayments.com"
```

### **Step 2: Verify `.env` is Gitignored**

Check `.gitignore` includes:
```
.env
.env*.local
```

### **Step 3: Test Configuration**

```bash
npx tsx scripts/test-payaid-connection.ts
```

---

## 🎯 **Usage**

### **Platform Payments (Admin Credentials)**
```typescript
import { getAdminPayAidConfig } from '@/lib/payments/get-admin-payment-config'
import { PayAidPayments } from '@/lib/payments/payaid'

// Get admin config
const adminConfig = getAdminPayAidConfig()
const payaid = new PayAidPayments(adminConfig)

// Use for:
// - App Store module purchases
// - Subscription payments
// - Platform-level transactions
```

### **Tenant Payments (Tenant Credentials)**
```typescript
import { getTenantPayAidConfig } from '@/lib/payments/get-tenant-payment-config'
import { PayAidPayments } from '@/lib/payments/payaid'

// Get tenant-specific config
const tenantConfig = await getTenantPayAidConfig(tenantId)
if (tenantConfig) {
  const payaid = new PayAidPayments(tenantConfig)
  
  // Use for:
  // - Tenant invoice payments
  // - Customer collections
  // - Tenant-specific transactions
}
```

---

## ✅ **What's Configured**

### **Files Created**
- ✅ `lib/payments/admin-credentials.ts` - Admin credential management
- ✅ `lib/payments/get-admin-payment-config.ts` - Admin config getter
- ✅ `scripts/test-payaid-connection.ts` - Test script

### **Files Updated**
- ✅ `app/api/billing/create-order/route.ts` - Uses admin credentials
- ✅ `app/api/billing/webhook/route.ts` - Uses admin credentials
- ✅ `lib/payments/payaid.ts` - Updated to use admin credentials
- ✅ `env.example` - Updated with admin credentials section

---

## 🚨 **Security Checklist**

- [x] Credentials in `.env` file (not in code)
- [x] `.env` file is gitignored
- [x] Admin-only access enforced
- [x] Never exposed to client-side
- [x] Never logged or displayed
- [x] Tenants use separate credentials

---

## 📝 **For Production**

1. **Set Environment Variables**
   - Use secure secret management (AWS Secrets Manager, etc.)
   - Never commit `.env` file
   - Rotate credentials periodically

2. **Monitor Access**
   - Log credential access attempts
   - Monitor for unauthorized usage
   - Set up alerts for suspicious activity

3. **Tenant Configuration**
   - Tenants configure their own credentials
   - Stored encrypted in database
   - Isolated from admin credentials

---

**Last Updated:** December 2025  
**Security Level:** 🔒 **ADMIN ONLY**

