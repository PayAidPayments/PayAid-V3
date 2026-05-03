# 🔄 Module Reorganization Plan - 8 Module Structure

**Date:** December 2025  
**Status:** ⏳ **PENDING IMPLEMENTATION**  
**Purpose:** Reorganize from 6 modules to 8 modules + 3 global areas

---

## 🎯 **New Module Structure**

### **8 Primary Modules:**

1. **CRM** (`crm`)
2. **Sales** (`sales`)
3. **Marketing** (`marketing`)
4. **Finance** (`finance`)
5. **HR** (`hr`)
6. **Communication** (`communication`)
7. **AI Studio** (`ai-studio`)
8. **Analytics & Reporting** (`analytics`)

### **3 Global Areas (Always Accessible):**

- **Dashboard** - Cross-module overview
- **Settings** - User profile + org settings
- **Module Management** - Admin only

---

## 📋 **Module Classification**

### **1. CRM Module** (`crm`)

**Features:**
- Contacts
- Deals
- Tasks
- Products *(core catalog used by CRM & Sales)*
- Orders *(if these are post-deal sales orders)*
- Custom Dashboards *(if CRM-focused views)*

**API Routes:**
- `/api/contacts/*`
- `/api/deals/*`
- `/api/tasks/*`
- `/api/products/*` *(shared with Sales)*
- `/api/orders/*` *(if post-deal orders)*

**Frontend Pages:**
- `/dashboard/contacts/*`
- `/dashboard/deals/*`
- `/dashboard/tasks/*`
- `/dashboard/products/*` *(shared)*
- `/dashboard/orders/*` *(if post-deal)*

---

### **2. Sales Module** (`sales`)

**Features:**
- Landing Pages *(lead-gen/sales pages)*
- Checkout Pages
- Orders *(if these are ecommerce orders)*
- Products *(exposed here for sales, but owned by CRM/Inventory)*

**Note:** If "Orders" is the same concept across CRM and Sales, treat it as a single **Sales/Order Management** entity and surface it in both modules' navigation.

**API Routes:**
- `/api/landing-pages/*`
- `/api/checkout-pages/*`
- `/api/orders/*` *(if ecommerce orders)*
- `/api/products/*` *(read access)*

**Frontend Pages:**
- `/dashboard/landing-pages/*`
- `/dashboard/checkout-pages/*`
- `/dashboard/orders/*` *(if ecommerce)*

---

### **3. Marketing Module** (`marketing`)

**Features:**
- Campaigns
- Social Media
- Email Templates
- Events *(often run by marketing; if you plan full event ops later, you can split "Event Management" as its own module)*
- Setup WhatsApp *(Admin only, but still under Marketing/Communication)*
- WhatsApp Accounts
- WhatsApp Inbox
- WhatsApp Sessions

**API Routes:**
- `/api/marketing/*`
- `/api/social-media/*`
- `/api/email-templates/*`
- `/api/events/*`
- `/api/whatsapp/*`

**Frontend Pages:**
- `/dashboard/marketing/*`
- `/dashboard/social-media/*`
- `/dashboard/email-templates/*`
- `/dashboard/events/*`
- `/dashboard/whatsapp/*`

---

### **4. Finance Module** (`finance`)

**Features:**
- Invoices
- Accounting
- GST Reports
- Analytics *(rename here to **Financial Analytics** to avoid confusion)*
- Custom Reports *(if these are mainly finance; otherwise move to Analytics module)*

**API Routes:**
- `/api/invoices/*`
- `/api/accounting/*`
- `/api/gst/*`

**Frontend Pages:**
- `/dashboard/invoices/*`
- `/dashboard/accounting/*`
- `/dashboard/gst/*`

---

### **5. HR Module** (`hr`)

**Features:**
- Employees
- Hiring
- Payroll
- Reports (HR)

**API Routes:**
- `/api/hr/*`

**Frontend Pages:**
- `/dashboard/hr/*`

---

### **6. Communication Module** (`communication`)

**Features:**
- Email Accounts *(Admin only)*
- Webmail
- Team Chat
- WhatsApp items could be cross-linked here, but primary ownership stays with Marketing.

**API Routes:**
- `/api/email/*`
- `/api/chat/*`

**Frontend Pages:**
- `/dashboard/email/*`
- `/dashboard/chat/*`

---

### **7. AI Studio Module** (`ai-studio`)

**Features:**
- Websites *(AI website builder)*
- Logo Generator
- AI Chat
- AI Calling Bot

**API Routes:**
- `/api/websites/*`
- `/api/logos/*`
- `/api/ai/*`
- `/api/calls/*`

**Frontend Pages:**
- `/dashboard/websites/*`
- `/dashboard/logos/*`
- `/dashboard/ai/*`
- `/dashboard/calls/*`

---

### **8. Analytics & Reporting Module** (`analytics`)

**Features:**
- Custom Reports *(if cross-module; otherwise keep under respective module)*
- Custom Dashboards *(if they aggregate across modules)*
- Cross-module Analytics pages

**API Routes:**
- `/api/analytics/*`
- `/api/reports/*`
- `/api/dashboards/*`

**Frontend Pages:**
- `/dashboard/analytics/*`
- `/dashboard/reports/*`
- `/dashboard/dashboards/*`

---

## 🔄 **Migration from Old to New Structure**

### **Old → New Mapping:**

| Old Module | New Module(s) | Notes |
|------------|---------------|-------|
| `crm` | `crm` + `sales` + `marketing` | Split into 3 modules |
| `invoicing` | `finance` | Merged into Finance |
| `accounting` | `finance` | Merged into Finance |
| `hr` | `hr` | No change |
| `whatsapp` | `marketing` + `communication` | Split between Marketing & Communication |
| `analytics` | `analytics` | Renamed to "Analytics & Reporting" |

### **New Modules Created:**
- `sales` - New module
- `marketing` - New module (from CRM split)
- `finance` - New module (merged invoicing + accounting)
- `communication` - New module (from WhatsApp split)
- `ai-studio` - New module (from Analytics split)

---

## 📊 **Sidebar Items Reclassification**

### **CRM Module** (`crm`)
- Contacts
- Deals
- Tasks
- Products *(shared with Sales)*
- Orders *(if post-deal orders)*

### **Sales Module** (`sales`)
- Landing Pages
- Checkout Pages
- Orders *(if ecommerce orders)*
- Products *(shared with CRM)*

### **Marketing Module** (`marketing`)
- Campaigns
- Social Media
- Email Templates
- Events
- Setup WhatsApp
- WhatsApp Accounts
- WhatsApp Inbox
- WhatsApp Sessions

### **Finance Module** (`finance`)
- Invoices
- Accounting
- GST Reports
- Financial Analytics

### **HR Module** (`hr`)
- Employees
- Hiring
- Payroll
- Reports (HR)

### **Communication Module** (`communication`)
- Email Accounts
- Webmail
- Team Chat

### **AI Studio Module** (`ai-studio`)
- Websites
- Logo Generator
- AI Chat
- AI Calling Bot

### **Analytics & Reporting Module** (`analytics`)
- Custom Reports
- Custom Dashboards
- Analytics Dashboard

---

## 🔧 **Implementation Steps**

### **Step 1: Update Module Definitions** ⏳
- [ ] Update `ModuleDefinition` seed script
- [ ] Add new modules: `sales`, `marketing`, `finance`, `communication`, `ai-studio`
- [ ] Update existing modules: `crm`, `analytics`
- [ ] Mark old modules as deprecated: `invoicing`, `accounting`, `whatsapp`

### **Step 2: Update Sidebar Classification** ⏳
- [ ] Reclassify all sidebar items to new modules
- [ ] Update sidebar component
- [ ] Test module filtering

### **Step 3: Update API Routes** ⏳
- [ ] Update route module assignments
- [ ] Update license checking middleware
- [ ] Test API access control

### **Step 4: Update Frontend Pages** ⏳
- [ ] Update `ModuleGate` component usage
- [ ] Update page module assignments
- [ ] Test page access control

### **Step 5: Database Migration** ⏳
- [ ] Create migration script to update existing tenant licenses
- [ ] Map old modules to new modules:
  - `invoicing` → `finance`
  - `accounting` → `finance`
  - `whatsapp` → `marketing` + `communication`
- [ ] Update `Tenant.licensedModules` array

### **Step 6: Update Documentation** ⏳
- [ ] Update Phase 2 codebase analysis
- [ ] Update module templates
- [ ] Update deployment guides

---

## ⚠️ **Migration Considerations**

### **Backward Compatibility:**
- Old module IDs (`invoicing`, `accounting`, `whatsapp`) should still work during transition
- Add mapping layer to translate old → new module IDs
- Gradual migration: Support both old and new IDs for 1-2 months

### **License Migration:**
- Tenants with `invoicing` → Grant `finance`
- Tenants with `accounting` → Grant `finance`
- Tenants with `whatsapp` → Grant `marketing` + `communication`
- Tenants with `crm` → Keep `crm`, optionally offer `sales` + `marketing` as add-ons

### **Shared Features:**
- Products: Shared between `crm` and `sales`
- Orders: Determine if single entity or separate
- Custom Reports/Dashboards: Determine if cross-module or module-specific

---

## 📋 **Checklist**

- [ ] Update module seed script
- [ ] Update sidebar classification
- [ ] Update API route module assignments
- [ ] Update frontend page module assignments
- [ ] Create database migration script
- [ ] Update documentation
- [ ] Test module access control
- [ ] Test license migration
- [ ] Deploy changes

---

**Status:** ⏳ **PENDING IMPLEMENTATION**  
**Priority:** 🟡 **HIGH** - Affects Phase 2 structure
