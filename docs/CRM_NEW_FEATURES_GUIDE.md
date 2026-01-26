# CRM New Features Guide

**Last Updated:** January 23, 2026

This guide covers all newly implemented CRM features from the gap analysis implementation.

---

## 📋 Table of Contents

1. [Web Forms & Lead Capture](#web-forms--lead-capture)
2. [Advanced Reporting & BI Engine](#advanced-reporting--bi-engine)
3. [Territory & Quota Management](#territory--quota-management)
4. [Advanced Account Management](#advanced-account-management)
5. [Calendar Sync & Scheduling](#calendar-sync--scheduling)
6. [Quote/CPQ Management](#quotecpq-management)
7. [Contract Management](#contract-management)
8. [Duplicate Contact Detection](#duplicate-contact-detection)

---

## 1. Web Forms & Lead Capture

### Overview
Create embeddable web forms to capture leads directly from your website.

### Features
- **Visual Form Builder**: Drag-and-drop form designer
- **Multiple Field Types**: Text, email, phone, select, checkbox, radio, textarea, number, date
- **Conditional Logic**: Show/hide fields based on responses
- **Auto-Contact Creation**: Automatically creates contacts from form submissions
- **Form Analytics**: Track views, submissions, and conversion rates
- **Embed Options**: JavaScript embed, iframe, or direct URL

### How to Use

#### Creating a Form
1. Navigate to **CRM → Forms**
2. Click **Create Form**
3. Enter form name, description, and slug
4. Add fields using the form builder
5. Configure field properties (required, placeholder, options)
6. Save and publish

#### Embedding a Form
1. Go to your form's detail page
2. Copy the embed code (JavaScript or iframe)
3. Paste into your website HTML
4. Form will automatically capture submissions

#### Viewing Submissions
1. Go to **Forms → [Form Name]**
2. Click **Submissions** tab
3. View all form submissions with metadata

### API Endpoints
- `POST /api/forms` - Create form
- `GET /api/forms` - List forms
- `GET /api/forms/[id]` - Get form
- `PUT /api/forms/[id]` - Update form
- `DELETE /api/forms/[id]` - Delete form
- `GET /api/forms/[slug]/render` - Public form render
- `POST /api/forms/[slug]/submit` - Public form submission
- `GET /api/forms/[id]/analytics` - Form analytics
- `GET /api/forms/[id]/submissions` - Get submissions

---

## 2. Advanced Reporting & BI Engine

### Overview
Create custom reports with advanced filtering, grouping, and scheduling.

### Features
- **Custom Report Builder**: Build reports from multiple data sources
- **Advanced Filters**: Equals, contains, greater than, less than, between, in, not in
- **Grouping & Aggregation**: Group by fields, calculate sums, averages, counts
- **Scheduled Reports**: Automatically generate and email reports (daily/weekly/monthly)
- **Export Options**: PDF, Excel, CSV
- **Attribution Analysis**: Track which touchpoints convert leads

### How to Use

#### Creating a Report
1. Navigate to **CRM → Reports**
2. Click **Create Report**
3. Select data source (contacts, deals, tasks, invoices, orders, expenses)
4. Add filters
5. Select columns to display
6. Configure grouping and sorting
7. Save report

#### Scheduling Reports
1. Open your report
2. Click **Schedule**
3. Set frequency (daily/weekly/monthly)
4. Set day and time
5. Add recipient email addresses
6. Choose export format
7. Enable scheduling

#### Viewing Attribution
1. Navigate to **Reports → Attribution**
2. Select date range
3. View touchpoint analysis
4. See conversion paths

### API Endpoints
- `POST /api/reports/[id]/execute` - Execute report
- `GET /api/reports/[id]/export` - Export report (PDF/Excel/CSV)
- `GET /api/reports/attribution` - Get attribution analysis

---

## 3. Territory & Quota Management

### Overview
Define sales territories and track quotas vs actuals.

### Features
- **Territory Definition**: Geographic and industry-based criteria
- **Sales Rep Assignment**: Assign reps to territories with roles (owner/member)
- **Quota Tracking**: Set quotas for reps or territories (monthly/quarterly/annual)
- **Automatic Actuals**: Calculate actual revenue from closed deals
- **Lead Routing**: Automatically route leads to appropriate reps based on territory

### How to Use

#### Creating a Territory
1. Navigate to **CRM → Territories**
2. Click **Create Territory**
3. Enter name and description
4. Define criteria:
   - States, cities, postal codes
   - Industries
   - Annual revenue range
5. Assign sales reps
6. Save

#### Setting Quotas
1. Navigate to **CRM → Quotas**
2. Click **Create Quota**
3. Select sales rep or territory
4. Choose period (monthly/quarterly/annual)
5. Set target amount
6. Save

#### Lead Routing
Leads are automatically routed when:
- A new contact is created
- A form is submitted
- Manual routing is triggered via API

Routing strategies:
- **Territory-based**: Route to rep in matching territory
- **Capacity-based**: Route to rep with least contacts
- **Round-robin**: Distribute evenly
- **Weighted**: Route to rep with highest conversion rate

### API Endpoints
- `POST /api/territories` - Create territory
- `GET /api/territories` - List territories
- `POST /api/territories/[id]/assign` - Assign sales rep
- `POST /api/quotas` - Create quota
- `GET /api/quotas` - List quotas
- `POST /api/quotas/[id]/update-actuals` - Update quota actuals
- `POST /api/leads/route` - Route lead

---

## 4. Advanced Account Management

### Overview
Manage B2B accounts with hierarchy, health scoring, and decision trees.

### Features
- **Account Hierarchy**: Parent-child account relationships
- **Account Health Scoring**: 0-100 score based on engagement, revenue, support, contracts
- **Decision Tree Mapping**: Map decision makers and their influence
- **Engagement Timeline**: Track all account interactions

### How to Use

#### Creating an Account
1. Navigate to **CRM → Accounts**
2. Click **Create Account**
3. Enter account details
4. Optionally select parent account
5. Save

#### Viewing Account Health
1. Open an account
2. Go to **Health** tab
3. View health score and risk level
4. See recommendations

#### Mapping Decision Tree
1. Open an account
2. Go to **Decision Tree** tab
3. Add decision makers:
   - Contact
   - Role
   - Influence (0-100)
   - Relationship (champion, influencer, decision_maker, blocker, end_user)
4. Save

### API Endpoints
- `POST /api/accounts` - Create account
- `GET /api/accounts` - List accounts
- `GET /api/accounts/[id]` - Get account with hierarchy
- `POST /api/accounts/[id]/health` - Calculate health score
- `PUT /api/accounts/[id]/decision-tree` - Update decision tree
- `GET /api/accounts/[id]/engagement` - Get engagement timeline

---

## 5. Calendar Sync & Scheduling

### Overview
Two-way sync with Google Calendar and Outlook.

### Features
- **Google Calendar Sync**: Connect and sync events
- **Outlook Calendar Sync**: Connect and sync events
- **Automatic Meeting Creation**: Calendar events become CRM meetings
- **Meeting Creation**: Create meetings in calendar from CRM

### How to Use

#### Connecting Calendar
1. Navigate to **Settings → Integrations**
2. Click **Connect Google Calendar** or **Connect Outlook**
3. Authorize access
4. Calendar will sync automatically

#### Syncing Events
1. Calendar events are automatically synced to CRM
2. Events become meetings linked to contacts
3. View in **CRM → Meetings**

#### Creating Meeting in Calendar
1. Create a meeting in CRM
2. Meeting is automatically created in connected calendar
3. Attendees receive calendar invites

### API Endpoints
- `POST /api/calendar/connect` - Connect calendar
- `POST /api/calendar/sync` - Sync calendar events

---

## 6. Quote/CPQ Management

### Overview
Generate quotes from deals with line items and pricing.

### Features
- **Quote Generation**: Create quotes from deals
- **Line Items**: Add products/services with quantities and pricing
- **Tax & Discounts**: Apply tax rates and discounts
- **Quote Numbering**: Automatic quote number generation
- **Status Tracking**: Draft, sent, viewed, accepted, expired, rejected

### How to Use

#### Creating a Quote
1. Open a deal
2. Click **Generate Quote**
3. Add line items:
   - Product name
   - Quantity
   - Unit price
   - Discount (optional)
4. Set tax rate
5. Set discount (optional)
6. Set validity period
7. Generate quote

#### Viewing Quotes
1. Navigate to **CRM → Quotes**
2. View all quotes with status
3. Click quote to view details

### API Endpoints
- `POST /api/quotes` - Generate quote
- `GET /api/quotes` - List quotes
- `GET /api/quotes/[id]` - Get quote
- `PUT /api/quotes/[id]` - Update quote status
- `DELETE /api/quotes/[id]` - Delete quote

---

## 7. Contract Management

### Overview
Track contracts, renewals, and expiration dates.

### Features
- **Contract Tracking**: Link contracts to deals, contacts, accounts
- **Renewal Alerts**: Automatic alerts 30 days before expiration
- **Expiring Contracts**: View contracts expiring soon
- **Renewal Management**: Renew contracts with new end dates

### How to Use

#### Creating a Contract
1. Navigate to **CRM → Contracts**
2. Click **Create Contract**
3. Link to deal, contact, or account
4. Enter contract details:
   - Contract number
   - Value
   - Start date
   - End date
   - Auto-renew option
5. Upload contract document
6. Save

#### Viewing Expiring Contracts
1. Navigate to **CRM → Contracts → Expiring**
2. View contracts expiring in next 90 days
3. Take action on renewals

#### Renewing a Contract
1. Open a contract
2. Click **Renew**
3. Set new end date
4. Contract status updates to active

### API Endpoints
- `GET /api/contracts/expiring` - Get expiring contracts
- `GET /api/contracts/renewals` - Get contracts requiring renewal
- `POST /api/contracts/[id]/renew` - Renew contract

---

## 8. Duplicate Contact Detection

### Overview
Find and merge duplicate contacts automatically.

### Features
- **Automatic Detection**: Scans all contacts for duplicates
- **Similarity Scoring**: Scores based on email, phone, name, company
- **Smart Merging**: Preserves all data during merge
- **Merge History**: Tracks merged contacts

### How to Use

#### Finding Duplicates
1. Navigate to **CRM → Contacts**
2. Click **Find Duplicates**
3. Set similarity threshold (default: 70%)
4. View duplicate matches
5. Review match reasons

#### Merging Contacts
1. Select primary contact
2. Select duplicate contact
3. Click **Merge**
4. All data is merged:
   - Deals moved to primary
   - Tasks moved to primary
   - Interactions moved to primary
   - Email messages moved to primary
   - Form submissions moved to primary
5. Duplicate contact is deleted

### API Endpoints
- `GET /api/contacts/duplicates` - Find duplicates
- `POST /api/contacts/duplicates/merge` - Merge contacts

---

## 🚀 Quick Start Checklist

- [ ] Create your first web form
- [ ] Set up sales territories
- [ ] Configure quotas for your team
- [ ] Connect Google/Outlook calendar
- [ ] Generate a quote from a deal
- [ ] Create an account with hierarchy
- [ ] Run duplicate detection
- [ ] Create a custom report

---

## 📞 Support

For questions or issues:
- Check the [API Documentation](./API_DOCUMENTATION.md)
- Review [Training Materials](./TRAINING_MATERIALS.md)
- Contact support@yourdomain.com

---

**Last Updated:** January 23, 2026
