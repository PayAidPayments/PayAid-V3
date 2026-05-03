# Frontend Migration Plan

**Date:** December 2025  
**Status:** ⏳ **IN PROGRESS**  
**Purpose:** Migrate ~130 frontend pages from monolith to modules

---

## 📊 **Migration Overview**

### **Current Structure**
```
app/dashboard/
├── contacts/          → CRM Module
├── deals/             → CRM Module
├── products/          → CRM Module
├── orders/             → CRM Module (shared with Sales)
├── tasks/              → CRM Module
├── invoices/           → Finance Module (Invoicing)
├── accounting/         → Finance Module (Accounting)
├── gst/                → Finance Module (Accounting)
├── hr/                 → HR Module
├── whatsapp/           → WhatsApp Module
├── marketing/          → Marketing Module
├── analytics/          → Analytics Module
├── reports/            → Analytics Module
├── dashboards/         → Analytics Module
├── ai/                 → AI Studio Module
├── calls/              → AI Studio Module
├── websites/           → AI Studio Module
├── logos/              → AI Studio Module
├── email/              → Communication Module
├── chat/               → Communication Module
├── landing-pages/      → Sales Module (or CRM)
├── checkout-pages/     → Sales Module (or CRM)
├── email-templates/    → Marketing Module
├── events/             → Marketing Module
├── social-media/       → Marketing Module
├── settings/           → Core Module
├── admin/              → Core Module
├── billing/            → Core Module
└── page.tsx            → Core Module (Dashboard)
```

---

## 🎯 **Module Mapping**

### **1. CRM Module** (`crm-module/app/dashboard/`)
- ✅ contacts/
- ✅ deals/
- ✅ products/
- ✅ orders/
- ✅ tasks/
- ✅ landing-pages/ (or Sales)
- ✅ checkout-pages/ (or Sales)
- ✅ events/ (or Marketing)

**Total:** ~25 pages

---

### **2. Finance Module** (`finance-module/app/dashboard/`)
**Note:** Combining Invoicing + Accounting into Finance module

- ✅ invoices/ → `finance-module/app/dashboard/invoices/`
- ✅ accounting/ → `finance-module/app/dashboard/accounting/`
- ✅ gst/ → `finance-module/app/dashboard/gst/`

**Total:** ~15 pages

---

### **3. HR Module** (`hr-module/app/dashboard/`)
- ✅ hr/employees/
- ✅ hr/hiring/
- ✅ hr/payroll/
- ✅ hr/leave/
- ✅ hr/attendance/
- ✅ hr/onboarding/
- ✅ hr/tax-declarations/

**Total:** ~30 pages

---

### **4. Marketing Module** (`marketing-module/app/dashboard/`)
- ✅ marketing/campaigns/
- ✅ marketing/segments/
- ✅ marketing/analytics/
- ✅ marketing/social/
- ✅ email-templates/
- ✅ events/ (or CRM)

**Total:** ~15 pages

---

### **5. WhatsApp Module** (`whatsapp-module/app/dashboard/`)
- ✅ whatsapp/setup/
- ✅ whatsapp/accounts/
- ✅ whatsapp/inbox/
- ✅ whatsapp/sessions/

**Total:** ~5 pages

---

### **6. Analytics Module** (`analytics-module/app/dashboard/`)
- ✅ analytics/
- ✅ reports/
- ✅ dashboards/

**Total:** ~10 pages

---

### **7. AI Studio Module** (`ai-studio-module/app/dashboard/`)
- ✅ ai/
- ✅ calls/
- ✅ websites/
- ✅ logos/

**Total:** ~20 pages

---

### **8. Communication Module** (`communication-module/app/dashboard/`)
- ✅ email/accounts/
- ✅ email/webmail/
- ✅ chat/

**Total:** ~5 pages

---

### **9. Core Module** (`core-module/app/dashboard/`)
- ✅ page.tsx (Main dashboard)
- ✅ settings/
- ✅ admin/
- ✅ billing/
- ✅ setup/

**Total:** ~15 pages

---

## 🔄 **Migration Process**

### **Step 1: Create Module Directories**
```bash
# Create dashboard directories in each module
mkdir -p crm-module/app/dashboard
mkdir -p finance-module/app/dashboard
mkdir -p hr-module/app/dashboard
mkdir -p marketing-module/app/dashboard
mkdir -p whatsapp-module/app/dashboard
mkdir -p analytics-module/app/dashboard
mkdir -p ai-studio-module/app/dashboard
mkdir -p communication-module/app/dashboard
mkdir -p core-module/app/dashboard
```

### **Step 2: Copy Pages**
- Copy pages from `app/dashboard/` to module directories
- Update imports to use shared packages
- Update module gates

### **Step 3: Update Navigation**
- Update sidebar to use OAuth2 SSO for cross-module navigation
- Update links to point to module URLs

### **Step 4: Test**
- Test OAuth2 SSO flow
- Test cross-module navigation
- Test module gates

---

## 📋 **Migration Checklist**

### **CRM Module**
- [ ] contacts/
- [ ] deals/
- [ ] products/
- [ ] orders/
- [ ] tasks/
- [ ] landing-pages/
- [ ] checkout-pages/
- [ ] events/

### **Finance Module**
- [ ] invoices/
- [ ] accounting/
- [ ] gst/

### **HR Module**
- [ ] hr/employees/
- [ ] hr/hiring/
- [ ] hr/payroll/
- [ ] hr/leave/
- [ ] hr/attendance/
- [ ] hr/onboarding/
- [ ] hr/tax-declarations/

### **Marketing Module**
- [ ] marketing/campaigns/
- [ ] marketing/segments/
- [ ] marketing/analytics/
- [ ] marketing/social/
- [ ] email-templates/
- [ ] events/

### **WhatsApp Module**
- [ ] whatsapp/setup/
- [ ] whatsapp/accounts/
- [ ] whatsapp/inbox/
- [ ] whatsapp/sessions/

### **Analytics Module**
- [ ] analytics/
- [ ] reports/
- [ ] dashboards/

### **AI Studio Module**
- [ ] ai/
- [ ] calls/
- [ ] websites/
- [ ] logos/

### **Communication Module**
- [ ] email/accounts/
- [ ] email/webmail/
- [ ] chat/

### **Core Module**
- [ ] page.tsx
- [ ] settings/
- [ ] admin/
- [ ] billing/
- [ ] setup/

---

## 🚀 **Next Steps**

1. ✅ Create migration plan
2. ⏳ Create module directories
3. ⏳ Copy pages to modules
4. ⏳ Update imports
5. ⏳ Update navigation
6. ⏳ Test OAuth2 SSO
7. ⏳ Test cross-module navigation

---

**Status:** ⏳ **IN PROGRESS**  
**Next:** Create module directories and start migration

