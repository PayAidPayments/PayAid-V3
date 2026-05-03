# Setup Admin PayAid Payments Credentials

**SECURITY:** Follow these steps to securely configure admin credentials

---

## 🔐 **Admin Credentials**

```
API Key: [YOUR-API-KEY] (get from PayAid Payments dashboard)
SALT:    [YOUR-SALT] (get from PayAid Payments dashboard)
Base URL: https://api.payaidpayments.com
```

---

## 📋 **Step-by-Step Setup**

### **Step 1: Open `.env` File**

Create or open `.env` file in the project root.

### **Step 2: Add Credentials**

Add these lines to your `.env` file:

```env
# Admin PayAid Payments Credentials (Platform Payments Only)
# SECURITY: Admin Team Only - Never share with tenants
PAYAID_ADMIN_API_KEY="[YOUR-API-KEY]"
PAYAID_ADMIN_SALT="[YOUR-SALT]"
PAYAID_PAYMENTS_BASE_URL="https://api.payaidpayments.com"
PAYAID_PAYMENTS_PG_API_URL="https://api.payaidpayments.com"
```

### **Step 3: Verify `.env` is Gitignored**

Check that `.gitignore` includes:
```
.env
.env*.local
```

### **Step 4: Test Configuration**

```bash
npx tsx scripts/test-payaid-connection.ts
```

Expected output:
```
✅ Admin Credentials Loaded:
   API Key: 9306f7fd...
   SALT: a64c89fe...
   Base URL: https://api.payaidpayments.com

✅ PayAid Payments instance created successfully!
```

---

## ✅ **Verification**

After adding credentials:

1. **Test connection:**
   ```bash
   npx tsx scripts/test-payaid-connection.ts
   ```

2. **Test App Store:**
   - Start server: `npm run dev`
   - Go to: `/app-store`
   - Add module to cart
   - Proceed to checkout
   - Payment should work

---

## 🔒 **Security Reminders**

- ✅ Never commit `.env` file
- ✅ Never share credentials in chat/logs
- ✅ Admin credentials are platform-only
- ✅ Tenants configure their own credentials

---

## 📝 **Complete `.env` Example**

Your `.env` should include:

```env
# Database
DATABASE_URL="..."

# Admin PayAid Payments (Platform Payments)
PAYAID_ADMIN_API_KEY="[YOUR-API-KEY]"
PAYAID_ADMIN_SALT="[YOUR-SALT]"
PAYAID_PAYMENTS_BASE_URL="https://api.payaidpayments.com"
PAYAID_PAYMENTS_PG_API_URL="https://api.payaidpayments.com"

# Other config...
```

---

**After adding credentials, run the test script to verify!**

