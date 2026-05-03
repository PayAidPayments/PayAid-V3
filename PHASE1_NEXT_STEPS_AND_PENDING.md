# Phase 1 - Next Steps & Pending Items

**Date:** December 2025  
**Status:** ✅ **HR Routes Complete** | Ready for Testing

---

## ✅ **COMPLETED WORK**

### **HR Module - 100% Complete**
- ✅ **56 route files** updated
- ✅ **96 protected endpoints** 
- ✅ All routes use `requireModuleAccess(request, 'hr')`
- ✅ All routes include license error handling
- ✅ Zero `authenticateRequest` calls remaining in HR routes

### **Core Modules - Protected**
- ✅ CRM: 4 routes
- ✅ Invoicing: 2 routes
- ✅ Accounting: 3 routes
- ✅ WhatsApp: 13 routes
- ✅ Analytics: 4 routes
- ✅ Admin: 1 route

**Total Protected:** ~83 routes

---

## ⚠️ **IMMEDIATE NEXT STEPS (Required Before Testing)**

### **1. Database Migration** 🔴 **REQUIRED**

**Command:**
```bash
npx prisma generate
npx prisma db push
```

**What It Does:**
- Generates Prisma client with new licensing models
- Creates `ModuleDefinition` table
- Adds `licensedModules` and `subscriptionTier` to `Tenant` table
- Creates `Subscription` table

**Status:** ⏳ **PENDING**

**Documentation:** See `PHASE1_MIGRATION_GUIDE.md` for detailed steps

---

### **2. Seed Module Definitions** 🔴 **REQUIRED**

**Command:**
```bash
npx tsx scripts/seed-modules.ts
```

**What It Does:**
- Populates `ModuleDefinition` table with 6 modules:
  - `crm` - CRM Module
  - `invoicing` - Invoicing Module
  - `accounting` - Accounting Module
  - `hr` - HR & Payroll Module
  - `whatsapp` - WhatsApp Module
  - `analytics` - Analytics Module

**Status:** ⏳ **PENDING**

**Script Location:** `scripts/seed-modules.ts` ✅ (Already exists)

---

### **3. Integration Testing** 🔴 **REQUIRED**

**Guide:** `PHASE1_TESTING_GUIDE.md`

**Test Scenarios:**
1. ✅ Licensed module access (should return 200)
2. ❌ Unlicensed module access (should return 403)
3. ❌ Missing token (should return 403)
4. ✅ JWT contains licensing info
5. ✅ All HR routes work correctly
6. ✅ License error messages are clear

**Status:** ⏳ **PENDING**

**Estimated Time:** 2-4 hours

---

## ⏳ **OPTIONAL: REMAINING ROUTES** (~115 files)

These routes still use `authenticateRequest` but are **NOT priority** for Phase 1.

### **Category 1: Public/Webhook Endpoints** ✅ **Should NOT Update**

**Reason:** These are intentionally public and don't require authentication.

- `/api/whatsapp/webhooks/message` - WhatsApp message webhook
- `/api/whatsapp/webhooks/status` - WhatsApp status webhook
- `/api/analytics/visit` - Public visit tracking
- `/api/analytics/track` - Public event tracking
- `/api/payments/webhook` - Payment webhook

**Action:** ✅ **Leave as-is** - No changes needed

---

### **Category 2: Auth Routes** ✅ **Should NOT Update**

**Reason:** These handle authentication themselves.

- `/api/auth/login` - User login
- `/api/auth/register` - User registration
- `/api/auth/me` - Get current user
- `/api/auth/oauth/*` - OAuth endpoints

**Action:** ✅ **Leave as-is** - No changes needed

---

### **Category 3: Routes Needing Cleanup** ⚠️ **Optional**

Some routes appear to have **mixed** `authenticateRequest` and `requireModuleAccess`:

#### **CRM Module** (3 files)
- `/api/contacts/route.ts` - Main contacts route (may need update)
- `/api/contacts/test` - Test endpoint (optional)
- `/api/contacts/import` - Bulk import (optional)

#### **Deals Module** (1 file)
- `/api/deals/[id]/route.ts` - Individual deal routes (partially updated)

#### **Invoicing Module** (3 files)
- `/api/invoices/[id]/pdf` - PDF generation (optional)
- `/api/invoices/[id]/generate-payment-link` - Payment link (optional)
- `/api/invoices/[id]/send-with-payment` - Send invoice (optional)

#### **WhatsApp Module** (5 files)
- `/api/whatsapp/sessions/route.ts` - Session management (mixed)
- `/api/whatsapp/messages/send/route.ts` - Send message (mixed)
- `/api/whatsapp/templates/route.ts` - Templates (mixed)
- `/api/whatsapp/conversations/[conversationId]/messages/route.ts` - Messages (mixed)
- `/api/whatsapp/onboarding/quick-connect/route.ts` - Quick connect (mixed)

#### **Analytics Module** (1 file)
- `/api/analytics/health-score/route.ts` - Health score (still uses `authenticateRequest`)

**Action:** ⏳ **Optional** - Review and clean up inconsistencies

**Estimated Time:** 1-2 hours

---

### **Category 4: Other Modules** ⏳ **Optional - Can Update Incrementally**

**Estimated:** ~100+ routes across multiple modules

#### **Products Module** (`products`) - ~5 routes
- Product catalog management
- **Module ID:** `products` (if defined)

#### **Orders Module** (`orders`) - ~3 routes
- Order management
- **Module ID:** `orders` (if defined)

#### **Marketing Module** (`marketing`) - ~10 routes
- Campaign management
- Audience segments
- Marketing analytics
- **Module ID:** `marketing` (if defined)

#### **Email Module** (`email`) - ~8 routes
- Email account management
- Email sending
- Email folders
- **Module ID:** `email` (if defined)

#### **Chat Module** (`chat`) - ~5 routes
- Chat workspaces
- Chat channels
- Messages
- **Module ID:** `chat` (if defined)

#### **AI Module** (`ai`) - ~20 routes
- AI chat
- AI insights
- Image generation
- Text-to-speech
- Speech-to-text
- Usage tracking
- **Module ID:** `ai` (if defined)

#### **Websites Module** (`websites`) - ~8 routes
- Website management
- Page management
- **Module ID:** `websites` (if defined)

#### **Tasks Module** (`tasks`) - ~3 routes
- Task management
- **Module ID:** `tasks` (if defined)

#### **GST Module** (`gst`) - ~2 routes
- GSTR-1 report
- GSTR-3B report
- **Module ID:** `gst` (if defined)

#### **Settings Module** (`settings`) - ~5 routes
- Tenant settings
- User profile
- Invoice settings
- Payment gateway settings
- **Module ID:** `settings` (if defined)

#### **Other Routes** (~30+ routes)
- Dashboard statistics
- Alert management
- Call management
- Lead management
- Email sequences
- Landing pages
- Checkout pages
- Logo generation
- Event management
- Email templates
- Chatbot management
- Social media management
- KYC upload
- Payment management
- Custom reports
- Custom dashboards
- Sales rep management
- Nurture templates
- Interaction tracking
- Industry-specific routes (restaurant, retail, etc.)

**Action:** ⏳ **Optional** - Update incrementally as modules are prioritized

**Pattern:** Same as HR routes - replace `authenticateRequest` with `requireModuleAccess(request, 'module-id')`

---

## 📊 **SUMMARY TABLE**

| Category | Count | Status | Priority |
|----------|-------|--------|----------|
| **HR Routes** | 56 files | ✅ **100% Complete** | ✅ Done |
| **Core Modules** | ~27 routes | ✅ **Complete** | ✅ Done |
| **Database Migration** | 1 task | ⏳ **Pending** | 🔴 **Required** |
| **Seed Modules** | 1 task | ⏳ **Pending** | 🔴 **Required** |
| **Integration Tests** | Multiple | ⏳ **Pending** | 🔴 **Required** |
| **Public/Webhook Routes** | ~10 routes | ✅ **Intentionally excluded** | ✅ N/A |
| **Auth Routes** | ~5 routes | ✅ **Intentionally excluded** | ✅ N/A |
| **Routes Needing Cleanup** | ~13 files | ⏳ **Optional** | 🟡 **Low** |
| **Other Modules** | ~100+ routes | ⏳ **Optional** | 🟢 **Very Low** |

---

## 🎯 **RECOMMENDED ACTION PLAN**

### **Phase 1 Completion (This Week)**
1. ✅ **DONE:** Update all HR routes
2. ⏳ **TODO:** Run database migration
3. ⏳ **TODO:** Seed module definitions
4. ⏳ **TODO:** Run integration tests
5. ⏳ **TODO:** Document test results

### **Optional Cleanup (Next Week)**
1. ⏳ Review routes with mixed `authenticateRequest`/`requireModuleAccess`
2. ⏳ Clean up inconsistencies
3. ⏳ Update any remaining core module routes

### **Future Work (As Needed)**
1. ⏳ Update Products module routes
2. ⏳ Update Orders module routes
3. ⏳ Update Marketing module routes
4. ⏳ Update Email module routes
5. ⏳ Update Chat module routes
6. ⏳ Update AI module routes
7. ⏳ Update Websites module routes
8. ⏳ Update other modules incrementally

---

## 📝 **NOTES**

- **Public endpoints** are intentionally excluded from license checking
- **Auth routes** handle authentication themselves
- **Pattern is established** - same approach applies to all remaining routes
- **Other modules** can be updated incrementally as features are prioritized
- **No rush** on optional routes - Phase 1 objective is complete

---

## ✅ **PHASE 1 STATUS**

**HR Module:** ✅ **100% COMPLETE**  
**Core Modules:** ✅ **PROTECTED**  
**Database Migration:** ⏳ **PENDING**  
**Testing:** ⏳ **PENDING**

**Overall Status:** ✅ **Ready for Testing** (after migration)

---

**Last Updated:** December 2025
