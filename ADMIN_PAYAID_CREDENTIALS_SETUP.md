# Admin PayAid Payments Credentials Setup

**SECURITY:** Admin-only credentials for PayAid V3 platform payments

---

## 🔐 **Admin Credentials**

These credentials are for **PayAid Admin Team ONLY** and are used for:
- Module subscription payments
- App Store purchases  
- Platform-level transactions
- Collection subscriptions

**Tenants must configure their own API keys** for their payment collections.

---

## 📋 **Credentials**

### **Admin API Key**
```
[YOUR-API-KEY] (get from PayAid Payments dashboard)
```

### **Admin SALT**
```
[YOUR-SALT] (get from PayAid Payments dashboard)
```

### **Base URL**
```
https://api.payaidpayments.com
```

---

## ⚙️ **Configuration**

### **Step 1: Update `.env` File**

Add these environment variables to your `.env` file:

```env
# Admin PayAid Payments Credentials (Platform Payments Only)
# SECURITY: These are admin-only credentials
# Tenants must configure their own credentials for their payments
PAYAID_ADMIN_API_KEY="[YOUR-API-KEY]"
PAYAID_ADMIN_SALT="[YOUR-SALT]"
PAYAID_PAYMENTS_BASE_URL="https://api.payaidpayments.com"
PAYAID_PAYMENTS_PG_API_URL="https://api.payaidpayments.com"

# Backward compatibility (uses admin credentials)
PAYAID_PAYMENTS_API_KEY="[YOUR-API-KEY]"
PAYAID_PAYMENTS_SALT="[YOUR-SALT]"
```

### **Step 2: Verify `.env` is in `.gitignore`**

Ensure `.env` is in `.gitignore` to prevent committing credentials:

```gitignore
.env
.env*.local
```

---

## 🔒 **Security Measures**

### **1. Environment Variables Only**
- ✅ Credentials stored in `.env` (not in code)
- ✅ `.env` file is gitignored
- ✅ Never exposed to client-side code

### **2. Admin-Only Access**
- ✅ Credentials only accessible to admin/owner users
- ✅ Tenants cannot view admin credentials
- ✅ Each tenant configures their own credentials

### **3. Tenant-Specific Credentials**
- Tenants configure their own API keys via:
  - Settings → Payment Gateway
  - Stored in `TenantPaymentSettings` table
  - Encrypted in database

---

## 📊 **Usage**

### **For Platform Payments (Admin)**
```typescript
import { getAdminPayAidConfig } from '@/lib/payments/get-admin-payment-config'

// Get admin config (for subscriptions, app store purchases)
const adminConfig = getAdminPayAidConfig()
const payaid = new PayAidPayments(adminConfig)
```

### **For Tenant Payments**
```typescript
import { getTenantPayAidConfig } from '@/lib/payments/get-tenant-payment-config'

// Get tenant-specific config (for their invoice payments)
const tenantConfig = await getTenantPayAidConfig(tenantId)
if (tenantConfig) {
  const payaid = new PayAidPayments(tenantConfig)
}
```

---

## ✅ **Verification**

### **Test Admin Credentials**
```bash
# Test connection (after setting .env)
npx tsx scripts/test-payaid-connection.ts
```

### **Check Integration**
1. Go to App Store: `/app-store`
2. Add module to cart
3. Proceed to checkout
4. Payment should use admin credentials

---

## 🚨 **Important Notes**

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Admin credentials are platform-level** - Used for subscriptions
3. **Tenants need their own credentials** - For their invoice payments
4. **Keep SALT secret** - Never expose in logs or client code

---

## 📝 **For Production**

1. Set environment variables on production server
2. Use secure secret management (AWS Secrets Manager, etc.)
3. Rotate credentials periodically
4. Monitor for unauthorized access

---

**Last Updated:** December 2025  
**Security Level:** 🔒 **ADMIN ONLY**

