# Demo Business Comprehensive Seeder

This directory contains a comprehensive seeding system for **Demo Business Pvt Ltd** that ensures full data coverage from **March 2025 to February 2026** across all platform modules.

## 🎯 Objective

- Overwrite all old seed/demo data
- Ensure **continuous, realistic data from 1 March 2025 to 29 Feb 2026**
- **No module, feature, tab, card, or page** should appear empty for this tenant
- All dashboards, lists, reports, timelines, and detail views must have backing records

## 📋 Usage

### Seed Demo Business Data

```bash
npm run seed:demo-business
```

This will:
1. Reset all existing demo business data
2. Seed all modules with data distributed across the full date range
3. Display a comprehensive summary

### Validate Demo Data

```bash
npm run validate:demo-data
```

This verifies that all modules have data in the correct date range.

## 📊 Modules Seeded

### CRM Module
- **150 Contacts** - Distributed across 12 months
- **200 Deals** - Various stages (lead, qualified, proposal, negotiation, won, lost)
- **300 Tasks** - Different priorities and statuses
- **500 Activity Feed Entries** - Track all entity changes
- **100 Meetings** - Scheduled across the year

### Sales & Billing Module
- **400 Orders** - Various statuses (pending, confirmed, processing, shipped, delivered, cancelled)
- **350 Invoices** - Linked to orders with various statuses
- **Order Items** - 1-5 items per order

### Marketing Module
- **32 Campaigns** - 12 monthly campaigns + 20 additional (email, WhatsApp, SMS, ads)
- **8 Landing Pages** - With views and conversion tracking
- **10 Lead Sources** - With conversion metrics
- **1000 Email Events** - Opens, clicks, bounces

### Support Module
- **300 Support Tickets** - Various statuses and priorities
- **2000 Ticket Replies** - 2-8 replies per ticket

### Operations Module
- **1000 Audit Logs** - Track all CRUD operations
- **200 Automation Runs** - Various triggers and statuses
- **500 Notifications** - User notifications

## 📅 Date Range

All data is constrained to:
- **Start:** March 1, 2025 00:00:00 UTC
- **End:** February 28, 2026 23:59:59 UTC

Data is distributed across the entire range, not clustered near the current date.

## 🔧 Architecture

### Core Files

- `demo-business-master-seed.ts` - Master orchestrator
- `reset-demo-business.ts` - Hard reset function
- `date-utils.ts` - Date range utilities
- `seed-crm.ts` - CRM module seeder
- `seed-sales-billing.ts` - Sales & billing seeder
- `seed-marketing.ts` - Marketing seeder
- `seed-support.ts` - Support seeder
- `seed-operations.ts` - Operations seeder
- `validate-demo-data.ts` - Validation script

### Key Features

1. **Idempotent** - Can run multiple times without duplicates
2. **Batched Operations** - Prevents database connection pool exhaustion
3. **Defensive** - Handles missing models gracefully
4. **Comprehensive** - Covers all major modules and features

## 🚀 After Seeding

1. Log in as `admin@demo.com` / `Test@1234`
2. Navigate to subdomain: `demo`
3. Verify all dashboards show data
4. Test different date filters (Last 7 days, This month, Last 3 months, etc.)
5. Ensure no empty states appear

## 📝 Notes

- The seeder uses batched operations (20 records per batch) to avoid connection pool issues
- Some models may not exist in all schema versions - the seeder handles this gracefully
- Subscription is tenant-level and not reset (it's tied to the tenant, not demo data)
