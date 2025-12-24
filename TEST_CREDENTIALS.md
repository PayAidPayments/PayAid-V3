# 🧪 Test Credentials for PayAid V3

## Quick Setup

Run the seed script to create test users and sample data:

```bash
npm run db:seed
```

Or manually register through the UI at: http://localhost:3000/register

---

## 📋 Pre-seeded Test Accounts

### Account 1: Demo Business (Full Features)
- **Email:** `admin@demo.com`
- **Password:** `Test@1234`
- **Subdomain:** `demo`
- **Business Name:** Demo Business Pvt Ltd
- **Plan:** Professional

**Sample Data Included:**
- ✅ 3 Contacts (John Doe, Jane Smith, Acme Corporation)
- ✅ 3 Products (Premium Widget, Standard Widget, Consulting Service)
- ✅ 2 Deals (Q1 Enterprise Deal, Acme Corporation Contract)
- ✅ 2 Tasks (Follow up, Prepare proposal)
- ✅ Business GSTIN: 29ABCDE1234F1Z5
- ✅ Full business address configured

---

### Account 2: Sample Company (Starter Plan)
- **Email:** `user@sample.com`
- **Password:** `Test@1234`
- **Subdomain:** `sample`
- **Business Name:** Sample Company
- **Plan:** Starter

**Sample Data:**
- Empty account (you can add your own data)

---

## 🚀 How to Use

### Option 1: Use Pre-seeded Accounts (Recommended)

1. **Run the seed script:**
   ```bash
   npm run db:seed
   ```

2. **Login at:** http://localhost:3000/login
   - Use: `admin@demo.com` / `Test@1234`

3. **You'll have access to:**
   - Dashboard with sample data
   - Contacts, Products, Deals, Tasks
   - All features ready to test

---

### Option 2: Create New Account

1. **Go to:** http://localhost:3000/register

2. **Fill in the form:**
   - Name: Your Name
   - Email: your-email@example.com
   - Password: (min 8 characters)
   - Business Name: Your Business Name
   - Subdomain: your-business-name (lowercase, no spaces)

3. **You'll be automatically logged in**

---

## 📊 What You Can Test

### ✅ Complete Features Available:

1. **Dashboard**
   - View statistics
   - Revenue tracking
   - Recent activity
   - Quick actions

2. **Contacts Management**
   - List, create, edit contacts
   - Customer/Lead types
   - GSTIN tracking

3. **Deals Pipeline**
   - Kanban board
   - Deal stages
   - Value tracking
   - Probability

4. **Products Catalog**
   - Product management
   - HSN/SAC codes
   - GST rates
   - Stock tracking

5. **Orders**
   - Create orders
   - Product selection
   - GST calculation
   - Payment methods

6. **Invoices**
   - Indian GST compliant
   - CGST/SGST/IGST calculation
   - Place of Supply
   - Professional format

7. **Tasks**
   - Task management
   - Assignments
   - Due dates
   - Status tracking

8. **Settings**
   - Profile settings
   - Business settings (GSTIN, address)
   - Tenant configuration

9. **Accounting**
   - Expense tracking
   - Financial reports (P&L, Balance Sheet)

---

## 🔑 Quick Login Links

- **Login Page:** http://localhost:3000/login
- **Register Page:** http://localhost:3000/register
- **Dashboard:** http://localhost:3000/dashboard (after login)

---

## 📝 Notes

- All passwords are: `Test@1234`
- Subdomains must be unique (lowercase, alphanumeric, hyphens only)
- Email addresses must be unique
- Sample data is only created for the `demo` tenant
- You can create more accounts via registration

---

## 🛠️ Troubleshooting

### If seed script fails:

1. **Make sure database is running:**
   ```bash
   # Check PostgreSQL
   docker ps
   ```

2. **Check database connection:**
   ```bash
   # Verify .env has correct DATABASE_URL
   ```

3. **Run Prisma generate:**
   ```bash
   npm run db:generate
   ```

4. **Try manual registration:**
   - Go to http://localhost:3000/register
   - Create account manually

---

**Happy Testing! 🎉**
