# PayAid V3 - Sidebar Items Classification

## Complete List of All Sidebar Items

### Main Navigation (Top Level)
| Item Name | Icon | Route | Current Module | Notes |
|-----------|------|-------|----------------|-------|
| Dashboard | 📊 | `/dashboard` | `null` (Always accessible) | Core navigation |
| Contacts | 👥 | `/dashboard/contacts` | `crm` | CRM module |
| Deals | 💼 | `/dashboard/deals` | `crm` | CRM module |
| Invoices | 🧾 | `/dashboard/invoices` | `invoicing` | Invoicing module |
| Products | 📦 | `/dashboard/products` | `crm` | ✅ Updated - CRM module |
| Orders | 🛒 | `/dashboard/orders` | `crm` | ✅ Updated - CRM module |

---

### Section: Sales & Operations 💼
| Item Name | Icon | Route | Current Module | Notes |
|-----------|------|-------|----------------|-------|
| Tasks | ✅ | `/dashboard/tasks` | `crm` | CRM module |
| Accounting | 💰 | `/dashboard/accounting` | `accounting` | Accounting module |
| Analytics | 📈 | `/dashboard/analytics` | `analytics` | Analytics module |

---

### Section: Marketing 📢
| Item Name | Icon | Route | Current Module | Notes |
|-----------|------|-------|----------------|-------|
| Campaigns | 📢 | `/dashboard/marketing/campaigns` | `crm` | CRM module |
| Social Media | 📱 | `/dashboard/marketing/social` | `crm` | CRM module |
| Email Templates | ✉️ | `/dashboard/email-templates` | `crm` | CRM module |
| Events | 🎉 | `/dashboard/events` | `crm` | CRM module |

---

### Section: Communication 💬
| Item Name | Icon | Route | Current Module | Notes |
|-----------|------|-------|----------------|-------|
| Email Accounts | 📧 | `/dashboard/email/accounts` | `crm` | CRM module |
| Webmail | ✉️ | `/dashboard/email/webmail` | `crm` | CRM module |
| Team Chat | 💬 | `/dashboard/chat` | `crm` | CRM module |

---

### Section: WhatsApp 📱
| Item Name | Icon | Route | Current Module | Notes |
|-----------|------|-------|----------------|-------|
| Setup WhatsApp | ⚡ | `/dashboard/whatsapp/setup` | `whatsapp` | WhatsApp module |
| WhatsApp Accounts | 📱 | `/dashboard/whatsapp/accounts` | `whatsapp` | WhatsApp module |
| WhatsApp Inbox | 📥 | `/dashboard/whatsapp/inbox` | `whatsapp` | WhatsApp module |
| WhatsApp Sessions | 🔗 | `/dashboard/whatsapp/sessions` | `whatsapp` | WhatsApp module |

---

### Section: AI & Automation 🤖
| Item Name | Icon | Route | Current Module | Notes |
|-----------|------|-------|----------------|-------|
| AI Chat | 💬 | `/dashboard/ai/chat` | `analytics` | Analytics module |
| AI Calling Bot | 📞 | `/dashboard/calls` | `analytics` | Analytics module |

---

### Section: Web & Design 🌐
| Item Name | Icon | Route | Current Module | Notes |
|-----------|------|-------|----------------|-------|
| Websites | 🌐 | `/dashboard/websites` | `crm` | CRM module |
| Landing Pages | 📄 | `/dashboard/landing-pages` | `crm` | CRM module |
| Logo Generator | 🎨 | `/dashboard/logos` | `crm` | CRM module |
| Checkout Pages | 💳 | `/dashboard/checkout-pages` | `crm` | CRM module |

---

### Section: HR & Payroll 👔
| Item Name | Icon | Route | Current Module | Notes |
|-----------|------|-------|----------------|-------|
| Employees | 👔 | `/dashboard/hr/employees` | `hr` | HR module |
| Hiring | 📝 | `/dashboard/hr/hiring/job-requisitions` | `hr` | HR module |
| Payroll | 💰 | `/dashboard/hr/payroll/cycles` | `hr` | HR module |
| Reports | 📈 | `/dashboard/hr/payroll/reports` | `hr` | HR module |

---

### Section: Reports & Tools 📊
| Item Name | Icon | Route | Current Module | Notes |
|-----------|------|-------|----------------|-------|
| GST Reports | 📋 | `/dashboard/gst/gstr-1` | `accounting` | ✅ Updated - Accounting module |
| Custom Reports | 📈 | `/dashboard/reports/custom` | `analytics` | ✅ Updated - Analytics module |
| Custom Dashboards | 📊 | `/dashboard/dashboards/custom` | `analytics` | ✅ Updated - Analytics module |

---

### Admin & Settings (Bottom)
| Item Name | Icon | Route | Current Module | Notes |
|-----------|------|-------|----------------|-------|
| Module Management | 🔧 | `/dashboard/admin/modules` | `null` (Admin only) | Admin panel |
| Settings | ⚙️ | `/dashboard/settings` | `null` (Always accessible) | Core settings |

---

## Summary by Module

### CRM Module (`crm`) - 18 items
- Contacts
- Deals
- Tasks
- Campaigns
- Social Media
- Email Templates
- Events
- Email Accounts
- Webmail
- Team Chat
- Websites
- Landing Pages
- Logo Generator
- Checkout Pages
- Products (currently `null` - should be `crm`?)
- Orders (currently `null` - should be `crm`?)

### Invoicing Module (`invoicing`) - 1 item
- Invoices

### Accounting Module (`accounting`) - 1 item
- Accounting
- GST Reports (currently NOT SET - should be `accounting`?)

### HR Module (`hr`) - 4 items
- Employees
- Hiring
- Payroll
- Reports (HR)

### WhatsApp Module (`whatsapp`) - 4 items
- Setup WhatsApp
- WhatsApp Accounts
- WhatsApp Inbox
- WhatsApp Sessions

### Analytics Module (`analytics`) - 3 items
- Analytics
- AI Chat
- AI Calling Bot
- Custom Reports (currently NOT SET - should be `analytics`?)
- Custom Dashboards (currently NOT SET - should be `analytics`?)

### No Module Required (`null`) - 3 items
- Dashboard (always accessible)
- Module Management (admin only)
- Settings (always accessible)

---

## Items Needing Module Assignment

✅ **ALL ITEMS CLASSIFIED** - All 5 items have been updated with correct module assignments:

1. ✅ **Products** (`/dashboard/products`) - Updated to `crm`
2. ✅ **Orders** (`/dashboard/orders`) - Updated to `crm`
3. ✅ **GST Reports** (`/dashboard/gst/gstr-1`) - Updated to `accounting`
4. ✅ **Custom Reports** (`/dashboard/reports/custom`) - Updated to `analytics`
5. ✅ **Custom Dashboards** (`/dashboard/dashboards/custom`) - Updated to `analytics`

---

## Total Count
- **Total Sidebar Items:** 35 items
- **With Module Assignment:** 35 items ✅
- **Without Module Assignment:** 0 items ✅

---

## Recommended Module Assignments

Based on functionality:

1. **Products** → `crm` (product catalog is part of CRM/sales)
2. **Orders** → `crm` (orders are part of CRM/sales)
3. **GST Reports** → `accounting` (GST is accounting/finance)
4. **Custom Reports** → `analytics` (reporting is analytics)
5. **Custom Dashboards** → `analytics` (dashboards are analytics)

---

## ✅ Status: COMPLETE

All sidebar items have been classified and updated in the sidebar code. The module assignments are now correct and will be enforced by the licensing system.

