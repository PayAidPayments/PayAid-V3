# 🧪 PayAid V3 - Demo Testing Guide

**Complete guide to test the platform with demo credentials and sample data**

---

## 🚀 **Quick Start**

### **Step 1: Start Development Server**

```bash
npm run dev
```

**Wait 10-20 seconds** for the server to compile, then access:
```
http://localhost:3000
```

---

### **Step 2: Seed Demo Data**

Run the seed script to create test users and comprehensive sample data:

```bash
npm run db:seed
```

**Or for comprehensive sample data (includes HR, WhatsApp, Email, Chat, etc.):**
```bash
npm run db:seed-all
```

---

## 🔑 **Demo Login Credentials**

### **Account 1: Demo Business (Full Features - Recommended)**

**Login URL:** `http://localhost:3000/login`

- **Email:** `admin@demo.com`
- **Password:** `Test@1234`
- **Subdomain:** `demo`
- **Business Name:** Demo Business Pvt Ltd
- **Plan:** Professional
- **Role:** Owner

**Sample Data Included:**
- ✅ **20+ Contacts** (Customers, Leads, Vendors)
- ✅ **15+ Products** (Widgets, Software, Services, Hardware)
- ✅ **20+ Deals** (Various stages: Lead, Qualified, Proposal, Negotiation, Won, Lost)
- ✅ **10+ Tasks** (Various statuses and priorities)
- ✅ **5+ Orders** (With GST calculations)
- ✅ **5+ Invoices** (GST compliant with payment links)
- ✅ **Business Settings** (GSTIN: 29ABCDE1234F1Z5, Full address)
- ✅ **HR Data** (if using `db:seed-all`):
  - Employees, Departments, Designations
  - Attendance records
  - Leave requests
  - Payroll cycles
- ✅ **Email Accounts** (if using `db:seed-all`):
  - 2 email accounts with sample messages
- ✅ **Chat Workspaces** (if using `db:seed-all`):
  - Workspaces, channels, messages
- ✅ **WhatsApp Accounts** (if using `db:seed-all`):
  - WhatsApp business accounts

---

### **Account 2: Sample Company (Starter Plan)**

- **Email:** `user@sample.com`
- **Password:** `Test@1234`
- **Subdomain:** `sample`
- **Business Name:** Sample Company
- **Plan:** Starter
- **Role:** Owner

**Sample Data:**
- Empty account (you can add your own data to test)

---

## 📊 **What You Can Test**

### **1. Dashboard** (`/dashboard`)
- ✅ View business statistics
- ✅ Revenue tracking and charts
- ✅ Recent activity feed
- ✅ Quick action buttons
- ✅ Health score metrics

### **2. CRM Module** (`/dashboard/contacts`, `/dashboard/deals`)
- ✅ **Contacts Management:**
  - List 20+ contacts (Customers, Leads, Vendors)
  - Create, edit, delete contacts
  - Filter by type, status, city, state
  - Search functionality
  - GSTIN tracking
- ✅ **Deals Pipeline:**
  - Kanban board with 20+ deals
  - Deal stages (Lead → Qualified → Proposal → Negotiation → Won/Lost)
  - Value tracking (₹15,000 to ₹500,000)
  - Probability tracking
  - Filter by stage, value, contact

### **3. Products & Inventory** (`/dashboard/products`)
- ✅ **Product Catalog:**
  - 15+ products across categories
  - Widgets, Software Licenses, Services, Hardware
  - HSN/SAC codes
  - GST rates
  - Stock tracking
  - Cost and sale prices

### **4. Orders** (`/dashboard/orders`)
- ✅ **Order Management:**
  - Create orders from contacts
  - Add multiple products
  - Automatic GST calculation (CGST/SGST/IGST)
  - Place of Supply logic
  - Payment methods (Cash, UPI, Card, Bank Transfer)

### **5. Invoicing** (`/dashboard/invoices`)
- ✅ **Invoice Management:**
  - Indian GST compliant invoices
  - CGST/SGST/IGST calculation
  - Place of Supply handling
  - Professional PDF format
  - Payment link generation (PayAid Payments)
  - Invoice status tracking

### **6. Tasks** (`/dashboard/tasks`)
- ✅ **Task Management:**
  - Create, assign, track tasks
  - Due dates and priorities
  - Status tracking (Pending, In Progress, Completed)
  - Link to contacts/deals

### **7. Accounting** (`/dashboard/accounting`)
- ✅ **Expense Tracking:**
  - Record expenses
  - Categorize expenses
  - Attach receipts
- ✅ **Financial Reports:**
  - Profit & Loss statement
  - Balance Sheet
  - Custom date ranges

### **8. HR Module** (`/dashboard/hr/*`) - If seeded with `db:seed-all`
- ✅ **Employee Management:**
  - Employee directory
  - Departments and designations
  - Employee profiles
- ✅ **Attendance:**
  - Check-in/Check-out
  - Attendance calendar
  - Biometric import
- ✅ **Leave Management:**
  - Leave policies
  - Leave requests
  - Leave balances
- ✅ **Payroll:**
  - Payroll cycles
  - Salary structures
  - Statutory compliance (PF, ESI, PT)
  - Payslips

### **9. WhatsApp** (`/dashboard/whatsapp/*`) - If seeded with `db:seed-all`
- ✅ **WhatsApp Business:**
  - Account management
  - Session management
  - Message sending
  - Conversation management
  - Templates
  - Analytics

### **10. Email** (`/dashboard/email/*`) - If seeded with `db:seed-all`
- ✅ **Email Management:**
  - Email accounts
  - Webmail interface
  - Compose and send emails
  - Email folders
  - Sample messages

### **11. Chat** (`/dashboard/chat`) - If seeded with `db:seed-all`
- ✅ **Team Chat:**
  - Workspaces
  - Channels
  - Real-time messaging
  - @mentions
  - Sample messages

### **12. Settings** (`/dashboard/settings`)
- ✅ **Profile Settings:**
  - Update name, email, password
- ✅ **Business Settings:**
  - GSTIN configuration
  - Business address
  - Contact information
  - Logo upload

---

## 🎯 **Recommended Testing Flow**

### **Day 1: Core Features**
1. **Login** with `admin@demo.com` / `Test@1234`
2. **Explore Dashboard** - View statistics and metrics
3. **Test Contacts** - Browse, create, edit contacts
4. **Test Deals** - View pipeline, create new deals, move between stages
5. **Test Products** - Browse catalog, create products
6. **Test Orders** - Create order, add products, see GST calculation
7. **Test Invoices** - Create invoice, generate PDF, create payment link

### **Day 2: Advanced Features**
1. **Test Accounting** - Record expenses, view reports
2. **Test Tasks** - Create tasks, assign, track completion
3. **Test Settings** - Update business information
4. **Test HR** (if available) - Employee management, attendance, payroll
5. **Test WhatsApp** (if available) - Account setup, messaging
6. **Test Email** (if available) - Email management

---

## 📋 **Sample Data Details**

### **Contacts (20+ contacts)**
- **Types:** Customer, Lead, Qualified, Vendor
- **Locations:** Bangalore, Mumbai, Delhi, Chennai, Hyderabad
- **Companies:** Tech Solutions, Digital Marketing, Acme Corp, etc.

### **Products (15+ products)**
- **Categories:** Widgets, Software, Services, Hardware
- **Price Range:** ₹450 to ₹50,000
- **Stock:** Some with inventory, some services without stock

### **Deals (20+ deals)**
- **Stages:** Lead, Qualified, Proposal, Negotiation, Won, Lost
- **Value Range:** ₹15,000 to ₹500,000
- **Probability:** 10% to 90%
- **Status:** Active, Won, Lost

### **Orders (5+ orders)**
- Multiple products per order
- GST calculations (CGST/SGST/IGST)
- Various payment methods

### **Invoices (5+ invoices)**
- GST compliant format
- Payment links generated
- Various statuses (Draft, Sent, Paid, Overdue)

---

## 🔧 **Troubleshooting**

### **Issue: Can't Login**

1. **Check if database is seeded:**
   ```bash
   npm run db:seed
   ```

2. **Reset password:**
   ```bash
   npx tsx scripts/reset-admin-password.ts
   ```

3. **Check database connection:**
   - Verify `.env` has correct `DATABASE_URL`
   - Check if PostgreSQL is running

### **Issue: No Sample Data**

1. **Run seed script:**
   ```bash
   npm run db:seed
   ```

2. **For comprehensive data:**
   ```bash
   npm run db:seed-all
   ```

3. **Check if data exists:**
   ```bash
   npx tsx scripts/check-dashboard-data.ts
   ```

### **Issue: Server Not Starting**

1. **Check port 3000:**
   ```bash
   netstat -ano | findstr ":3000"
   ```

2. **Kill existing process:**
   ```bash
   taskkill /PID <pid> /F
   ```

3. **Start fresh:**
   ```bash
   npm run dev
   ```

---

## 🎉 **Quick Links**

- **Login:** http://localhost:3000/login
- **Register:** http://localhost:3000/register
- **Dashboard:** http://localhost:3000/dashboard (after login)
- **Contacts:** http://localhost:3000/dashboard/contacts
- **Deals:** http://localhost:3000/dashboard/deals
- **Products:** http://localhost:3000/dashboard/products
- **Orders:** http://localhost:3000/dashboard/orders
- **Invoices:** http://localhost:3000/dashboard/invoices
- **Tasks:** http://localhost:3000/dashboard/tasks
- **Accounting:** http://localhost:3000/dashboard/accounting
- **Settings:** http://localhost:3000/dashboard/settings

---

## 📝 **Notes**

- **All passwords:** `Test@1234`
- **Subdomains must be unique** (lowercase, alphanumeric, hyphens only)
- **Email addresses must be unique**
- **Sample data is created for `demo` tenant** (admin@demo.com)
- **You can create more accounts** via registration at `/register`
- **For comprehensive data** (HR, WhatsApp, Email, Chat), use `npm run db:seed-all`

---

## 🚀 **Next Steps After Testing**

1. **Explore all modules** in the sidebar
2. **Create your own data** to test workflows
3. **Test payment links** (if PayAid Payments is configured)
4. **Test email sending** (if SendGrid is configured)
5. **Test WhatsApp** (if WAHA is running)
6. **Review reports** and analytics

---

**Happy Testing! 🎉**

For issues or questions, check the `HANDOVER.md` file or run troubleshooting scripts in the `scripts/` directory.
