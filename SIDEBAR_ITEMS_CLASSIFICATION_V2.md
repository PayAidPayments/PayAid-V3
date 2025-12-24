# PayAid V3 - Sidebar Items Classification (V2 - 8 Module Structure)

**Date:** December 2025  
**Status:** ⏳ **PENDING UPDATE**  
**New Structure:** 8 modules + 3 global areas

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

### **3 Global Areas:**
- **Dashboard** - Always accessible
- **Settings** - Always accessible
- **Module Management** - Admin only

---

## 📋 **Complete Sidebar Classification**

### **Main Navigation (Top Level)**
| Item Name | Icon | Route | Module | Notes |
|-----------|------|-------|--------|-------|
| Dashboard | 📊 | `/dashboard` | `null` | Global - Always accessible |
| Contacts | 👥 | `/dashboard/contacts` | `crm` | CRM module |
| Deals | 💼 | `/dashboard/deals` | `crm` | CRM module |
| Tasks | ✅ | `/dashboard/tasks` | `crm` | CRM module |
| Products | 📦 | `/dashboard/products` | `crm` | Shared with Sales |
| Orders | 🛒 | `/dashboard/orders` | `crm` or `sales` | Depends on order type |

---

### **Section: Sales 💼**
| Item Name | Icon | Route | Module | Notes |
|-----------|------|-------|--------|-------|
| Landing Pages | 📄 | `/dashboard/landing-pages` | `sales` | Sales module |
| Checkout Pages | 💳 | `/dashboard/checkout-pages` | `sales` | Sales module |
| Orders | 🛒 | `/dashboard/orders` | `sales` | If ecommerce orders |

---

### **Section: Marketing 📢**
| Item Name | Icon | Route | Module | Notes |
|-----------|------|-------|--------|-------|
| Campaigns | 📢 | `/dashboard/marketing/campaigns` | `marketing` | Marketing module |
| Social Media | 📱 | `/dashboard/marketing/social` | `marketing` | Marketing module |
| Email Templates | ✉️ | `/dashboard/email-templates` | `marketing` | Marketing module |
| Events | 🎉 | `/dashboard/events` | `marketing` | Marketing module |
| Setup WhatsApp | ⚡ | `/dashboard/whatsapp/setup` | `marketing` | Marketing module |
| WhatsApp Accounts | 📱 | `/dashboard/whatsapp/accounts` | `marketing` | Marketing module |
| WhatsApp Inbox | 📥 | `/dashboard/whatsapp/inbox` | `marketing` | Marketing module |
| WhatsApp Sessions | 🔗 | `/dashboard/whatsapp/sessions` | `marketing` | Marketing module |

---

### **Section: Finance 💰**
| Item Name | Icon | Route | Module | Notes |
|-----------|------|-------|--------|-------|
| Invoices | 🧾 | `/dashboard/invoices` | `finance` | Finance module |
| Accounting | 💰 | `/dashboard/accounting` | `finance` | Finance module |
| GST Reports | 📋 | `/dashboard/gst/gstr-1` | `finance` | Finance module |
| Financial Analytics | 📈 | `/dashboard/accounting/analytics` | `finance` | Finance module |

---

### **Section: HR 👔**
| Item Name | Icon | Route | Module | Notes |
|-----------|------|-------|--------|-------|
| Employees | 👔 | `/dashboard/hr/employees` | `hr` | HR module |
| Hiring | 📝 | `/dashboard/hr/hiring/job-requisitions` | `hr` | HR module |
| Payroll | 💰 | `/dashboard/hr/payroll/cycles` | `hr` | HR module |
| Reports | 📈 | `/dashboard/hr/payroll/reports` | `hr` | HR module |

---

### **Section: Communication 💬**
| Item Name | Icon | Route | Module | Notes |
|-----------|------|-------|--------|-------|
| Email Accounts | 📧 | `/dashboard/email/accounts` | `communication` | Communication module |
| Webmail | ✉️ | `/dashboard/email/webmail` | `communication` | Communication module |
| Team Chat | 💬 | `/dashboard/chat` | `communication` | Communication module |

---

### **Section: AI Studio 🤖**
| Item Name | Icon | Route | Module | Notes |
|-----------|------|-------|--------|-------|
| Websites | 🌐 | `/dashboard/websites` | `ai-studio` | AI Studio module |
| Logo Generator | 🎨 | `/dashboard/logos` | `ai-studio` | AI Studio module |
| AI Chat | 💬 | `/dashboard/ai/chat` | `ai-studio` | AI Studio module |
| AI Calling Bot | 📞 | `/dashboard/calls` | `ai-studio` | AI Studio module |

---

### **Section: Analytics & Reporting 📊**
| Item Name | Icon | Route | Module | Notes |
|-----------|------|-------|--------|-------|
| Analytics Dashboard | 📊 | `/dashboard/analytics` | `analytics` | Analytics module |
| Custom Reports | 📈 | `/dashboard/reports/custom` | `analytics` | Analytics module |
| Custom Dashboards | 📊 | `/dashboard/dashboards/custom` | `analytics` | Analytics module |

---

### **Admin & Settings (Bottom)**
| Item Name | Icon | Route | Module | Notes |
|-----------|------|-------|--------|-------|
| Module Management | 🔧 | `/dashboard/admin/modules` | `null` | Admin only - Global |
| Settings | ⚙️ | `/dashboard/settings` | `null` | Global - Always accessible |

---

## 📊 **Summary by Module**

### **CRM Module** (`crm`) - 5 items
- Contacts
- Deals
- Tasks
- Products *(shared with Sales)*
- Orders *(if post-deal orders)*

### **Sales Module** (`sales`) - 3 items
- Landing Pages
- Checkout Pages
- Orders *(if ecommerce orders)*

### **Marketing Module** (`marketing`) - 8 items
- Campaigns
- Social Media
- Email Templates
- Events
- Setup WhatsApp
- WhatsApp Accounts
- WhatsApp Inbox
- WhatsApp Sessions

### **Finance Module** (`finance`) - 4 items
- Invoices
- Accounting
- GST Reports
- Financial Analytics

### **HR Module** (`hr`) - 4 items
- Employees
- Hiring
- Payroll
- Reports (HR)

### **Communication Module** (`communication`) - 3 items
- Email Accounts
- Webmail
- Team Chat

### **AI Studio Module** (`ai-studio`) - 4 items
- Websites
- Logo Generator
- AI Chat
- AI Calling Bot

### **Analytics & Reporting Module** (`analytics`) - 3 items
- Analytics Dashboard
- Custom Reports
- Custom Dashboards

### **Global** (`null`) - 3 items
- Dashboard
- Module Management
- Settings

---

## 🔄 **Changes from V1**

### **New Modules:**
- ✅ `sales` - New module (from CRM split)
- ✅ `marketing` - New module (from CRM split)
- ✅ `finance` - New module (merged invoicing + accounting)
- ✅ `communication` - New module (from WhatsApp split)
- ✅ `ai-studio` - New module (from Analytics split)

### **Updated Modules:**
- ✅ `crm` - Reduced scope (removed marketing, sales, AI features)
- ✅ `analytics` - Renamed to "Analytics & Reporting"

### **Deprecated Modules:**
- ⚠️ `invoicing` → Merged into `finance`
- ⚠️ `accounting` → Merged into `finance`
- ⚠️ `whatsapp` → Split into `marketing` + `communication`

---

## 📋 **Migration Notes**

### **Shared Features:**
- **Products:** Shared between `crm` and `sales` - Single backend entity, appears in both modules
- **Orders:** Determine if single entity (post-deal) or separate (ecommerce) - Can appear in both modules
- **Custom Reports/Dashboards:** Cross-module analytics - Appears in `analytics` module

### **Implementation Tip:**
- Maintain a **module → features** map (e.g., `CRM = [contacts, deals, tasks, products, orders]`)
- When an admin activates a module, enable all its mapped sidebar items
- Items that are shared (e.g., Products, Orders, Custom Reports/Dashboards) should have a single backend entity, but can appear under multiple module menus depending on context

---

## ✅ **Status: PENDING UPDATE**

This classification needs to be implemented in:
1. Sidebar component (`components/layout/sidebar.tsx`)
2. Module definitions (database seed)
3. API route module assignments
4. Frontend page module assignments
5. License checking middleware

---

**Next Steps:** See `MODULE_REORGANIZATION_PLAN.md` for implementation guide.
