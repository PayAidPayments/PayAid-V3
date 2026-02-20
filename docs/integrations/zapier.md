# Zapier Integration Guide

Connect PayAid V3 to 5,000+ apps via Zapier.

## Setup

### Step 1: Create API Key
1. Go to PayAid Dashboard → Developer → API Keys
2. Click "Create API Key"
3. Select scopes: `read:contacts`, `write:contacts`, `read:deals`, `write:deals`
4. Copy your API key (save it securely)

### Step 2: Create Zapier Account
1. Sign up at [zapier.com](https://zapier.com)
2. Create a new Zap

### Step 3: Add PayAid Trigger
1. Search for "PayAid" in Zapier
2. Select trigger: "New Contact" or "New Deal"
3. Enter your API key
4. Test the connection

### Step 4: Add Action App
1. Choose your action app (Gmail, Slack, etc.)
2. Configure the action
3. Test and enable your Zap

## Available Triggers

- **New Contact** - When a contact is created
- **New Deal** - When a deal is created
- **Invoice Created** - When an invoice is created
- **Workflow Executed** - When a workflow runs

## Available Actions

- **Create Contact** - Add a new contact
- **Create Deal** - Create a new deal
- **Create Invoice** - Generate an invoice
- **Update Contact** - Modify contact details

## Example Zaps

### Zap 1: Gmail → PayAid Contact
**Trigger:** New email in Gmail
**Action:** Create Contact in PayAid
- Map email sender → Contact email
- Map email subject → Contact name

### Zap 2: PayAid Deal → Slack Notification
**Trigger:** New Deal in PayAid
**Action:** Send Slack message
- Include deal name and value
- Tag sales team channel

### Zap 3: Google Forms → PayAid Lead
**Trigger:** New form submission
**Action:** Create Contact in PayAid
- Map form fields to contact fields
- Set contact type to "lead"

## API Endpoints Used

- `GET /api/v1/contacts` - List contacts
- `POST /api/v1/contacts` - Create contact
- `GET /api/v1/deals` - List deals
- `POST /api/v1/deals` - Create deal

## Rate Limits

- Default: 100 requests/hour per API key
- Upgrade for higher limits

## Support

For Zapier-specific issues, contact Zapier support.
For PayAid API issues, see API documentation or contact support.
