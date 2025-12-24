# Comprehensive Sample Data Guide

This guide explains how to populate your PayAid V3 platform with comprehensive sample data for all features and modules.

## 🎯 What This Does

The sample data seeder adds realistic, comprehensive data for:

### 📧 **Email & Communication**
- **8 Email Templates** - Welcome, Invoice Reminder, Event Invitation, Deal Follow-up, Product Launch, Order Confirmation, Thank You, Newsletter
- **15 Email Messages** - Various types including inquiries, partnerships, orders, newsletters, reminders, etc.
- **10 Scheduled Emails** - Emails scheduled for future delivery

### 📱 **Social Media Marketing**
- **12 Social Media Posts** - Published posts on Facebook, LinkedIn, Twitter/X, and Instagram with realistic analytics
- **3 Scheduled Posts** - Posts scheduled for future publishing
- **4 Social Media Accounts** - Facebook, LinkedIn, Twitter, Instagram with follower counts

### 📢 **Marketing Campaigns**
- **15 Marketing Campaigns** - Email, WhatsApp, and SMS campaigns with realistic analytics
  - Sent campaigns with delivery, open, click rates
  - Scheduled campaigns
  - Draft campaigns

### 💼 **Sales & CRM**
- **10 Additional Deals** - Various stages (lead, qualified, proposal, negotiation) with different values and probabilities
- **5 Customer Segments** - High-value customers, recent leads, active deals, email subscribers, overdue invoices
- **8 Lead Sources** - Google Search, Facebook Ads, LinkedIn, Referrals, etc. with conversion metrics

### ✅ **Tasks & Operations**
- **15 Tasks** - Various priorities and statuses (pending, in_progress, completed) with due dates

### 📦 **Products & Inventory**
- **10 Additional Products** - Software licenses, services, training programs, hosting, API access

### 🧾 **Invoices & Orders**
- **8 Additional Invoices** - Various statuses (draft, sent, paid, overdue) with GST calculations
- **8 Additional Orders** - Various statuses (pending, processing, shipped, delivered)

### 📧 **Lead Nurturing**
- **3 Nurture Templates** - Cold Lead Nurture (5 steps), Warm Lead Follow-up (3 steps), Re-engagement Campaign (4 steps)

---

## 🚀 How to Run

### Option 1: Run the Comprehensive Seeder (Recommended)

```bash
npx tsx prisma/seed-all-sample-data.ts
```

This will add sample data for ALL modules listed above.

### Option 2: Run Individual Seeders

If you only want specific data:

```bash
# Campaigns only
npx tsx prisma/seed-campaigns.ts

# Main seed (contacts, products, basic data)
npm run db:seed
```

---

## 📊 Data Overview

After running the comprehensive seeder, you'll have:

| Module | Count | Description |
|--------|-------|-------------|
| **Email Templates** | 8 | Professional templates with variables |
| **Social Media Posts** | 12 | Published posts with analytics |
| **Scheduled Posts** | 3 | Posts scheduled for future |
| **Email Messages** | 15 | Sample inbox emails |
| **Campaigns** | 15 | Email, WhatsApp, SMS campaigns |
| **Deals** | 10+ | Various stages and values |
| **Tasks** | 15 | Different priorities and statuses |
| **Products** | 10+ | Various categories |
| **Invoices** | 8+ | Different statuses with GST |
| **Orders** | 8+ | Various order statuses |
| **Segments** | 5 | Customer segmentation |
| **Lead Sources** | 8 | With conversion metrics |
| **Nurture Templates** | 3 | Multi-step email sequences |
| **Scheduled Emails** | 10 | Future email deliveries |
| **Interactions** | 20 | Email, call, meeting interactions |
| **Websites** | 3 | With pages and analytics |
| **Landing Pages** | 5 | With conversion tracking |
| **Checkout Pages** | 3 | Different configurations |
| **Events** | 5 | With registrations |
| **AI Calls** | 8 | With transcripts and FAQs |
| **Logos** | 5 | With style variations |
| **Website Chatbots** | 3 | With conversations |
| **Custom Dashboards** | 4 | With widgets |
| **Custom Reports** | 5 | Scheduled reports |
| **WhatsApp** | 5+ | Conversations and messages |

---

## 🔍 Where to View the Data

After seeding, navigate to these pages to see the sample data:

### Email & Communication
- **Email Templates:** `/dashboard/email-templates`
- **Email Messages:** `/dashboard/email/webmail`
- **Scheduled Emails:** `/dashboard/marketing/campaigns` (filter by scheduled)

### Social Media
- **Social Media Dashboard:** `/dashboard/marketing/social`
- **Published Posts:** `/dashboard/marketing/social` (main view)
- **Scheduled Posts:** `/dashboard/marketing/social/schedule`

### Marketing
- **Campaigns:** `/dashboard/marketing/campaigns`
- **Segments:** `/dashboard/marketing/segments`
- **Lead Sources:** `/dashboard/analytics` (lead sources section)

### Sales & CRM
- **Deals:** `/dashboard/deals`
- **Tasks:** `/dashboard/tasks`
- **Contacts:** `/dashboard/contacts`

### Products & Orders
- **Products:** `/dashboard/products`
- **Orders:** `/dashboard/orders`
- **Invoices:** `/dashboard/invoices`

### Lead Nurturing
- **Nurture Templates:** `/dashboard/marketing/nurture` (if available)
- **Enrollments:** Contact detail pages

### Website & Design
- **Websites:** `/dashboard/websites`
- **Landing Pages:** `/dashboard/landing-pages`
- **Checkout Pages:** `/dashboard/checkout-pages`
- **Logos:** `/dashboard/logos`

### Events
- **Events:** `/dashboard/events`
- **Event Registrations:** Event detail pages

### AI Features
- **AI Calls:** `/dashboard/calls`
- **Website Chatbots:** `/dashboard/websites/[id]` (chatbot section)

### Analytics & Reports
- **Custom Dashboards:** `/dashboard/dashboards/custom`
- **Custom Reports:** `/dashboard/reports/custom`

### WhatsApp
- **WhatsApp Inbox:** `/dashboard/whatsapp/inbox`
- **WhatsApp Accounts:** `/dashboard/whatsapp/accounts`
- **WhatsApp Templates:** `/dashboard/whatsapp/templates` (if available)

---

## 📝 Sample Data Details

### Email Templates

1. **Welcome Email** - Onboarding category, 45 uses
2. **Invoice Reminder** - Billing category, 120 uses
3. **Event Invitation** - Marketing category, 30 uses
4. **Deal Follow-up** - Sales category, 85 uses
5. **Product Launch Announcement** - Marketing category, 25 uses
6. **Order Confirmation** - Transactional category, 150 uses
7. **Thank You Note** - Customer service category, 60 uses
8. **Newsletter Template** - Marketing category, 12 uses

### Social Media Posts

**Facebook (4 posts):**
- Product launch announcement (145 engagement)
- Year-end thank you message (89 engagement)
- Flash sale promotion (234 engagement)
- Behind the scenes draft

**LinkedIn (3 posts):**
- Industry insights (78 engagement)
- Hiring announcement (156 engagement)
- Case study (92 engagement)

**Twitter/X (3 posts):**
- 10K customers milestone (320 engagement)
- Productivity tip (189 engagement)
- Community engagement (156 engagement)

**Instagram (2 posts):**
- Product launch (456 engagement)
- Team spotlight (289 engagement)

### Campaigns

- **Email Campaigns:** 6 sent, 1 scheduled, 1 draft
- **WhatsApp Campaigns:** 1 sent
- **SMS Campaigns:** 1 sent

All campaigns include realistic analytics:
- Delivery rates (94-99%)
- Open rates (28-48% for email, 85-92% for WhatsApp)
- Click rates (12-35%)
- Bounce rates (1-6%)

### Deals

10 deals with:
- Values ranging from ₹80,000 to ₹750,000
- Probabilities from 40% to 90%
- Stages: lead, qualified, proposal, negotiation
- Expected close dates in the next 10-60 days

### Tasks

15 tasks with:
- Various priorities (low, medium, high)
- Different statuses (pending, in_progress, completed)
- Due dates spread across the next 2-20 days
- Some linked to contacts

---

## 🔐 Login Credentials

Use these credentials to access the seeded data:

- **Email:** `admin@demo.com`
- **Password:** `Test@1234`

---

## ⚠️ Important Notes

1. **Existing Data:** The seeder will DELETE existing data for:
   - Email Templates
   - Social Media Posts
   - Email Messages (in demo accounts)
   - Campaigns
   - Segments
   - Lead Sources
   - Nurture Templates
   - Scheduled Emails

2. **Relationships:** The seeder uses existing contacts, products, and deals. Make sure you've run the main seed script first:
   ```bash
   npm run db:seed
   ```

3. **Tenant Required:** The seeder looks for a tenant with subdomain 'demo'. If you don't have one, run the main seed script first.

4. **Data Volume:** This creates a substantial amount of data. For production databases, consider running this only in development/staging environments.

---

## 🎨 UI/UX Benefits

Having this comprehensive sample data helps you:

1. **See Real Interfaces** - View how the platform looks with actual data
2. **Test Features** - Test all features with realistic scenarios
3. **Demo to Clients** - Show clients a fully populated platform
4. **Understand Workflows** - See how different modules work together
5. **Design Validation** - Validate UI/UX with real data volumes

---

## 🔄 Re-running the Seeder

You can safely re-run the seeder multiple times. It will:
- Delete existing sample data
- Create fresh sample data
- Maintain relationships with existing contacts/products

```bash
npx tsx prisma/seed-all-sample-data.ts
```

---

## 📈 Next Steps

After seeding:

1. **Explore the Dashboard** - Navigate through all modules
2. **Test Features** - Try creating, editing, and viewing data
3. **Check Analytics** - View campaign performance, lead source metrics
4. **Review Templates** - Check email templates and their usage
5. **Test Workflows** - Follow complete workflows (lead → deal → invoice)

---

## 🐛 Troubleshooting

**Issue:** "Demo tenant not found"
- **Solution:** Run `npm run db:seed` first to create the demo tenant

**Issue:** "No contacts found"
- **Solution:** The main seed script creates contacts. Run `npm run db:seed` first

**Issue:** Some data not appearing
- **Solution:** Check that you're logged in as `admin@demo.com` and viewing the correct tenant

---

## 📞 Support

If you encounter any issues with the sample data seeder, check:
1. Database connection is working
2. Main seed script has been run
3. You're using the correct tenant (subdomain: 'demo')

---

**Happy Exploring! 🚀**
