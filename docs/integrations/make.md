# Make (Integromat) Integration Guide

Automate PayAid V3 workflows with Make's visual automation platform.

## Setup

### Step 1: Get API Key
1. PayAid Dashboard → Developer → API Keys
2. Create new API key with required scopes
3. Copy API key

### Step 2: Create Make Scenario
1. Sign in to [make.com](https://make.com)
2. Create new scenario
3. Add PayAid module

### Step 3: Configure PayAid Module
1. Select "PayAid" from module list
2. Choose action (Create Contact, List Deals, etc.)
3. Enter API key
4. Enter base URL: `https://api.payaid.com`
5. Test connection

## Available Modules

### Triggers
- **Watch Contacts** - Monitor for new contacts
- **Watch Deals** - Monitor for new deals
- **Watch Invoices** - Monitor for new invoices

### Actions
- **Create Contact** - Add new contact
- **Update Contact** - Modify existing contact
- **Create Deal** - Create new deal
- **Create Invoice** - Generate invoice
- **List Contacts** - Get all contacts
- **List Deals** - Get all deals

## Example Scenarios

### Scenario 1: Email → PayAid → Slack
1. **Trigger:** Gmail - New Email
2. **Action:** PayAid - Create Contact
3. **Action:** Slack - Send Message

### Scenario 2: Webhook → PayAid → Email
1. **Trigger:** Webhook (from external system)
2. **Action:** PayAid - Create Deal
3. **Action:** Email - Send Notification

## Webhook Integration

You can also use Make webhooks with PayAid:

1. Create webhook URL in Make
2. In PayAid: Developer → Webhooks
3. Add webhook URL
4. Select events to subscribe to

## API Reference

Base URL: `https://api.payaid.com`
Authentication: Bearer token (API key)

See full API documentation: `/dashboard/developer/docs`
