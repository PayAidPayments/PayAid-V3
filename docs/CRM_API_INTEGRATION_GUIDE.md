# CRM API Integration Guide

**Last Updated:** January 23, 2026

Complete API reference for all new CRM features.

---

## 🔐 Authentication

All API endpoints require authentication via JWT token:

```http
Authorization: Bearer <your-jwt-token>
```

---

## 📋 Web Forms API

### Create Form
```http
POST /api/forms
Content-Type: application/json

{
  "name": "Contact Form",
  "slug": "contact-form",
  "description": "Main contact form",
  "status": "published",
  "fields": [
    {
      "name": "email",
      "label": "Email Address",
      "type": "email",
      "required": true,
      "placeholder": "your@email.com",
      "order": 0
    }
  ]
}
```

### List Forms
```http
GET /api/forms
```

### Get Form
```http
GET /api/forms/{id}
```

### Update Form
```http
PUT /api/forms/{id}
Content-Type: application/json

{
  "name": "Updated Form Name",
  "status": "published"
}
```

### Delete Form
```http
DELETE /api/forms/{id}
```

### Render Form (Public)
```http
GET /api/forms/{slug}/render?tenantId={tenantId}
```

### Submit Form (Public)
```http
POST /api/forms/{slug}/submit
Content-Type: application/json

{
  "tenantId": "tenant-id",
  "data": {
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Get Form Analytics
```http
GET /api/forms/{id}/analytics
```

### Get Form Submissions
```http
GET /api/forms/{id}/submissions
```

---

## 🗺️ Territory & Quota API

### Create Territory
```http
POST /api/territories
Content-Type: application/json

{
  "name": "North India",
  "description": "Delhi, Punjab, Haryana",
  "criteria": {
    "states": ["Delhi", "Punjab", "Haryana"],
    "cities": ["New Delhi", "Chandigarh"]
  },
  "salesRepIds": ["rep-id-1", "rep-id-2"]
}
```

### List Territories
```http
GET /api/territories
```

### Get Territory
```http
GET /api/territories/{id}
```

### Assign Sales Rep
```http
POST /api/territories/{id}/assign
Content-Type: application/json

{
  "salesRepId": "rep-id",
  "role": "owner"
}
```

### Create Quota
```http
POST /api/quotas
Content-Type: application/json

{
  "salesRepId": "rep-id",
  "period": "monthly",
  "periodStart": "2026-01-01T00:00:00Z",
  "periodEnd": "2026-01-31T23:59:59Z",
  "target": 100000
}
```

### List Quotas
```http
GET /api/quotas?salesRepId={id}&period=monthly
```

### Update Quota Actuals
```http
POST /api/quotas/{id}/update-actuals
```

### Route Lead
```http
POST /api/leads/route
Content-Type: application/json

{
  "contactData": {
    "state": "Delhi",
    "city": "New Delhi",
    "industry": "Technology"
  },
  "strategy": "territory-based"
}
```

---

## 🏢 Account Management API

### Create Account
```http
POST /api/accounts
Content-Type: application/json

{
  "name": "Acme Corp",
  "parentAccountId": "parent-id",
  "type": "Customer",
  "industry": "Technology",
  "annualRevenue": 5000000
}
```

### List Accounts
```http
GET /api/accounts?type=Customer&industry=Technology
```

### Get Account
```http
GET /api/accounts/{id}
```

### Calculate Health Score
```http
POST /api/accounts/{id}/health
```

### Update Decision Tree
```http
PUT /api/accounts/{id}/decision-tree
Content-Type: application/json

{
  "decisionMakers": [
    {
      "contactId": "contact-id",
      "name": "John Doe",
      "role": "CEO",
      "influence": 90,
      "relationship": "decision_maker"
    }
  ]
}
```

### Get Engagement Timeline
```http
GET /api/accounts/{id}/engagement?startDate=2026-01-01&endDate=2026-12-31
```

---

## 📊 Reporting API

### Execute Report
```http
POST /api/reports/{id}/execute
```

### Export Report
```http
GET /api/reports/{id}/export?format=pdf
```

### Get Attribution Analysis
```http
GET /api/reports/attribution?startDate=2026-01-01&endDate=2026-12-31&source=web
```

---

## 📅 Calendar API

### Connect Calendar
```http
POST /api/calendar/connect
Content-Type: application/json

{
  "provider": "google",
  "accessToken": "token",
  "refreshToken": "refresh-token"
}
```

### Sync Calendar
```http
POST /api/calendar/sync
Content-Type: application/json

{
  "provider": "google"
}
```

---

## 💰 Quotes API

### Generate Quote
```http
POST /api/quotes
Content-Type: application/json

{
  "dealId": "deal-id",
  "lineItems": [
    {
      "productName": "Product A",
      "quantity": 10,
      "unitPrice": 1000,
      "discount": 100
    }
  ],
  "taxRate": 18,
  "discount": 500,
  "validUntil": "2026-02-01T00:00:00Z"
}
```

### List Quotes
```http
GET /api/quotes?dealId={id}&status=accepted
```

### Get Quote
```http
GET /api/quotes/{id}
```

### Update Quote Status
```http
PUT /api/quotes/{id}
Content-Type: application/json

{
  "status": "accepted",
  "acceptedAt": "2026-01-23T00:00:00Z"
}
```

---

## 📄 Contracts API

### Get Expiring Contracts
```http
GET /api/contracts/expiring?daysAhead=90
```

### Get Contracts Requiring Renewal
```http
GET /api/contracts/renewals
```

### Renew Contract
```http
POST /api/contracts/{id}/renew
Content-Type: application/json

{
  "newEndDate": "2027-01-23T00:00:00Z"
}
```

---

## 🔍 Duplicate Detection API

### Find Duplicates
```http
GET /api/contacts/duplicates?threshold=70
```

### Merge Contacts
```http
POST /api/contacts/duplicates/merge
Content-Type: application/json

{
  "primaryContactId": "contact-1",
  "duplicateContactId": "contact-2"
}
```

---

## 📝 Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "error": "Error message",
  "details": { ... }
}
```

---

## 🔗 Related Documentation

- [User Guide](./CRM_NEW_FEATURES_GUIDE.md)
- [Training Materials](./TRAINING_MATERIALS.md)

---

**Last Updated:** January 23, 2026
