# PayAid CRM - API Documentation

**Base URL:** `https://api.payaid.com`  
**Version:** v1  
**Authentication:** Bearer Token (JWT)

---

## 🔐 Authentication

All API requests require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
X-Tenant-ID: <your-tenant-id>
```

---

## 📋 Endpoints

### Contacts

#### Get Contacts
```
GET /api/crm/contacts
Query Parameters:
  - search: string (optional)
  - limit: number (optional, default: 50)
  - offset: number (optional, default: 0)
  - status: string (optional)
```

#### Get Contact
```
GET /api/crm/contacts/:id
```

#### Create Contact
```
POST /api/crm/contacts
Body: {
  name: string
  email?: string
  phone?: string
  company?: string
  // ... other fields
}
```

#### Update Contact
```
PUT /api/crm/contacts/:id
Body: { ...fields to update }
```

#### Delete Contact
```
DELETE /api/crm/contacts/:id
```

#### Get Contact Health Score
```
GET /api/crm/contacts/:id/health-score
Response: {
  score: number (0-100)
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskPercentage: number
  components: { ... }
  factors: [ ... ]
  recommendations: [ ... ]
  playbook: [ ... ]
}
```

---

### Deals

#### Get Deals
```
GET /api/crm/deals
Query Parameters:
  - stage: string (optional)
  - limit: number (optional)
  - offset: number (optional)
```

#### Get Deal
```
GET /api/crm/deals/:id
```

#### Create Deal
```
POST /api/crm/deals
Body: {
  name: string
  value: number
  stage: string
  contactId?: string
  // ... other fields
}
```

#### Update Deal
```
PUT /api/crm/deals/:id
Body: { ...fields to update }
```

#### Get Deal Closure Probability
```
GET /api/crm/deals/:id/probability
Response: {
  probability: number (0-100)
  confidence: number (0-1)
  riskFactors: [ ... ]
  recommendations: [ ... ]
}
```

#### Get Rotting Deals
```
GET /api/crm/deals/rotting
Response: {
  rottingDeals: [ ... ]
  count: number
}
```

---

### Email

#### Connect Email Account
```
POST /api/email/connect
Body: {
  provider: 'gmail' | 'outlook'
  code: string (OAuth code)
}
```

#### Get Email Accounts
```
GET /api/email/accounts
```

#### Sync Emails
```
POST /api/email/sync
Body: {
  accountId: string
  syncDirection: 'inbound' | 'outbound' | 'both'
}
```

---

### Analytics

#### Pipeline Health
```
GET /api/crm/analytics/pipeline-health
Response: {
  projectedCloseRate: number
  stuckDeals: { ... }
  readyToMove: { ... }
  recommendedActions: [ ... ]
  riskLevel: 'low' | 'medium' | 'high'
}
```

#### Revenue Forecast
```
GET /api/crm/analytics/revenue-forecast
Response: {
  combinedForecast: {
    conservative: number
    base: number
    upside: number
    confidence: number
  }
  dealBasedForecast: { ... }
}
```

#### Churn Risk
```
GET /api/crm/analytics/churn-risk
Response: {
  highRiskCustomers: [ ... ]
  count: number
}
```

#### Upsell Opportunities
```
GET /api/crm/analytics/upsell-opportunities
Response: {
  opportunities: [ ... ]
  count: number
}
```

#### Scenario Planning
```
POST /api/crm/analytics/scenarios
Body: {
  scenarioType: 'close-deals' | 'lose-customers' | 'upsell-customers' | 'improve-closure-rate'
  parameters: { ... }
}
Response: {
  currentState: { ... }
  projectedState: { ... }
  actions: [ ... ]
  recommendations: [ ... ]
  confidence: number
}
```

---

### Comments & Collaboration

#### Get Comments
```
GET /api/crm/comments?entityType=deal&entityId=123
```

#### Create Comment
```
POST /api/crm/comments
Body: {
  content: string
  entityType: 'deal' | 'contact' | 'task' | 'project'
  entityId: string
  mentions?: string[]
  attachments?: [ ... ]
  parentId?: string
}
```

#### Update Comment
```
PUT /api/crm/comments/:id
Body: {
  content: string
}
```

#### Delete Comment
```
DELETE /api/crm/comments/:id
```

#### Get Activity Feed
```
GET /api/crm/activity-feed?entityType=deal&entityId=123
```

---

### Call Recording & Transcription

#### Search Transcripts
```
GET /api/crm/transcriptions/search?q=keyword&contactId=123
```

#### Get Meeting Intelligence
```
GET /api/crm/interactions/:id/meeting-intelligence
Response: {
  sentiment: { ... }
  summary: { ... }
  insights: [ ... ]
}
```

#### Process Meeting Intelligence
```
POST /api/crm/interactions/:id/meeting-intelligence
```

---

## 📝 Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

---

## 🔒 Rate Limiting

- **Standard:** 100 requests/minute
- **Premium:** 500 requests/minute
- **Enterprise:** Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 📚 SDKs

- **JavaScript/TypeScript:** `@payaid/crm-sdk`
- **Python:** `payaid-crm-python`
- **PHP:** `payaid/crm-php`

---

## 🆘 Support

- **API Support:** api-support@payaid.com
- **Documentation:** https://docs.payaid.com/api
- **Status Page:** https://status.payaid.com
