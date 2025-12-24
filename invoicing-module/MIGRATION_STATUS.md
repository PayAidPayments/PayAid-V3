# Invoicing Module - Migration Status

**Status:** ⏳ **IN PROGRESS**  
**Date:** Week 6

---

## ✅ **Completed Routes**

### **Invoices**
- ✅ `GET /api/invoices` - List all invoices
- ✅ `POST /api/invoices` - Create a new invoice
- ✅ `GET /api/invoices/[id]` - Get an invoice
- ✅ `PATCH /api/invoices/[id]` - Update an invoice
- ✅ `DELETE /api/invoices/[id]` - Delete an invoice
- ✅ `GET /api/invoices/[id]/pdf` - Generate PDF
- ✅ `POST /api/invoices/[id]/generate-payment-link` - Generate payment link
- ✅ `POST /api/invoices/[id]/send-with-payment` - Send invoice with payment link
- ⏳ `GET /api/invoices/[id]/track-payment-link` - Track payment link

---

## 📝 **Migration Notes**

1. **Imports Updated:**
   - ✅ Changed `@/lib/middleware/license` → `@payaid/auth`
   - ✅ Using `requireModuleAccess` and `handleLicenseError` from `@payaid/auth`

2. **Module License:**
   - Supports both `invoicing` and `finance` module IDs for compatibility
   - Tries `invoicing` first, falls back to `finance`

3. **Still Using:**
   - `@/lib/db/prisma` - For invoice models
   - `@/lib/invoicing/*` - For GST calculation and PDF generation
   - `@/lib/queue/bull` - For async tasks
   - `@/lib/middleware/tenant` - For tenant limits

4. **Next Steps:**
   - Migrate remaining invoice routes
   - Test invoice creation
   - Test payment link generation
   - Test PDF generation

---

## 🔄 **Migration Pattern**

For each route file:
1. Copy from `app/api/invoices/*` to `invoicing-module/app/api/invoices/*`
2. Update imports:
   - `requireModuleAccess, handleLicenseError` from `@payaid/auth`
3. Keep other imports as-is (they work from monorepo root)
4. Test the route
5. Document in this file

---

**Status:** ⏳ **IN PROGRESS**

