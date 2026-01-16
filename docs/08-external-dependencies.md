# PayAid V3 - External Dependencies & Integrations

**Version:** 3.0.0  
**Last Updated:** January 2026

---

## 1. Payment Gateway Integration

### PayAid Payments API Integration (Exclusive)

**Status:** ✅ Fully Integrated  
**Currency:** INR Only  
**Integration Type:** REST API

**API Endpoints:**
- Payment link generation: `POST /v2/executepaymentrequesturl`
- Payment status check: `POST /v2/checkpaymentstatus`
- Refund processing: `POST /v2/refund` (future)

**Integration Code:**
```typescript
// lib/payments/payaid.ts
export class PayAidPayments {
  async getPaymentRequestUrl(params: PaymentRequestParams) {
    // Generate hash
    const hash = generateHash({ ...params, api_key: this.config.apiKey }, this.config.salt)
    
    // Make API request
    const response = await fetch(`${this.baseUrl}/v2/executepaymentrequesturl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, api_key: this.config.apiKey, hash }),
    })
    
    return response.json()
  }
}
```

**Webhook Handling:**
- Endpoint: `POST /api/payments/webhook`
- Signature verification required
- Automatic invoice status updates
- Payment receipt emails

**Error Handling:**
- Retry logic for failed requests
- Webhook signature verification
- Payment status reconciliation

**Reconciliation Process:**
- Daily reconciliation job
- Compare PayAid Payments transactions with invoices
- Flag discrepancies
- Generate reconciliation reports

---

## 2. Communication Channels

### Email Service

**Primary:** SendGrid (Paid)
- **Cost:** Pay-per-use (free tier: 100 emails/day)
- **API:** SendGrid REST API
- **Features:** Templates, scheduling, analytics

**Alternative:** Gmail SMTP (Free)
- **Cost:** Free (up to 500 emails/day)
- **Setup:** OAuth2 authentication
- **Limitations:** Lower sending limits

**Self-Hosted:** Postfix/Sendmail (Free)
- **Cost:** ₹0 (self-hosted)
- **Setup:** Requires mail server configuration
- **Use Case:** High-volume sending

**Implementation:**
```typescript
// lib/email/service.ts
export async function sendEmail(options: EmailOptions) {
  if (process.env.SENDGRID_API_KEY) {
    return sendViaSendGrid(options)
  } else if (process.env.SMTP_HOST) {
    return sendViaSMTP(options)
  } else {
    throw new Error('No email service configured')
  }
}
```

### SMS Integration

**Primary:** Twilio (Paid)
- **Cost:** ~₹0.50-1.00 per SMS
- **API:** Twilio REST API
- **Features:** Delivery reports, phone number validation

**Alternative:** Exotel (India-focused, Paid)
- **Cost:** ~₹0.30-0.80 per SMS
- **API:** Exotel REST API
- **Features:** DLT registration, templates

**Free Alternative:** MSG91 Free Tier (Limited)
- **Cost:** Free (100 SMS/month)
- **API:** MSG91 REST API
- **Limitations:** Low volume, branding

**Implementation:**
```typescript
// lib/sms/service.ts
export async function sendSMS(options: SMSOptions) {
  if (process.env.TWILIO_ACCOUNT_SID) {
    return sendViaTwilio(options)
  } else if (process.env.EXOTEL_API_KEY) {
    return sendViaExotel(options)
  } else {
    throw new Error('No SMS service configured')
  }
}
```

### WhatsApp Messaging

**Primary:** WAHA (Self-Hosted, Free)
- **Cost:** ₹0 (self-hosted)
- **Setup:** Docker container
- **Features:** WhatsApp Business API, media support

**Alternative:** Twilio WhatsApp (Paid)
- **Cost:** ~₹1.00-2.00 per message
- **API:** Twilio WhatsApp API
- **Features:** Official WhatsApp Business API

**Implementation:**
```typescript
// lib/whatsapp/service.ts
export async function sendWhatsApp(options: WhatsAppOptions) {
  if (process.env.WAHA_API_URL) {
    return sendViaWAHA(options)
  } else if (process.env.TWILIO_WHATSAPP_NUMBER) {
    return sendViaTwilioWhatsApp(options)
  } else {
    throw new Error('No WhatsApp service configured')
  }
}
```

### In-App Notifications

**Implementation:** Built-in
- **Cost:** ₹0 (no external service)
- **Storage:** Database (`Notification` model)
- **Features:** Real-time updates (WebSocket), read/unread status

---

## 3. Data & Analytics

### Webhook Sources

**Incoming Webhooks:**
- PayAid Payments (payment status)
- External systems (custom integrations)

**Webhook Processing:**
- Signature verification
- Async processing (queue)
- Retry logic (3 attempts)
- Error logging

### Data Export Destinations

**Formats:**
- CSV (PapaParse)
- Excel (XLSX)
- PDF (PDFKit)

**Export Endpoints:**
- `/api/contacts/export` - Export contacts
- `/api/invoices/export` - Export invoices
- `/api/reports/[id]/export` - Export reports

### Analytics Platform

**Current:** Built-in analytics
- **Cost:** ₹0
- **Features:** Custom dashboards, reports

**Future Options:**
- Plausible (Privacy-focused, Paid)
- Fathom (Privacy-focused, Paid)
- Self-hosted analytics (Free)

---

## 4. Third-Party APIs

### Complete API List

| Service | Purpose | Cost | Rate Limit | Fallback |
|---------|---------|------|------------|----------|
| **PayAid Payments** | Payment processing | Paid | Per transaction | None (exclusive) |
| **SendGrid** | Email sending | Paid | 100/day (free) | Gmail SMTP |
| **Twilio** | SMS/WhatsApp | Paid | Per message | Exotel, MSG91 |
| **Groq API** | AI/LLM | Paid | Per token | Ollama, HuggingFace |
| **Ollama** | Local LLM | Free | Unlimited | Self-hosted |
| **HuggingFace** | AI/LLM | Paid | Per request | Ollama |
| **Google AI** | Image generation | Paid | Per request | HuggingFace |

### API Usage Quotas and Rate Limits

**PayAid Payments:**
- No explicit rate limit
- Transaction-based pricing

**SendGrid:**
- Free: 100 emails/day
- Paid: Based on plan

**Twilio:**
- SMS: Per message pricing
- Rate limit: 1 message/second (default)

**Groq API:**
- Rate limit: Based on plan
- Cost: ~₹0.10-0.50 per query

### Rate Limiting Handling

**Implementation:**
```typescript
// lib/api-client/rate-limit.ts
export class RateLimitedAPIClient {
  private queue: Queue = new Queue()
  
  async request(endpoint: string, options: RequestOptions) {
    // Check rate limit
    const canProceed = await this.checkRateLimit(endpoint)
    if (!canProceed) {
      // Queue request for later
      return this.queue.add(endpoint, options)
    }
    
    // Make request
    return this.makeRequest(endpoint, options)
  }
  
  private async checkRateLimit(endpoint: string): Promise<boolean> {
    const key = `rate_limit:${endpoint}`
    const count = await redis.incr(key)
    await redis.expire(key, 60) // 1 minute window
    return count <= this.getLimit(endpoint)
  }
}
```

**Backoff Strategy:**
- Exponential backoff
- Max retries: 3
- Initial delay: 1 second
- Max delay: 30 seconds

### Fallback Mechanisms

**AI Services Fallback Chain:**
1. Groq API (primary)
2. Ollama (local, if Groq fails)
3. HuggingFace (if Ollama fails)
4. Error message (if all fail)

**Email Service Fallback:**
1. SendGrid (primary)
2. Gmail SMTP (if SendGrid fails)
3. Self-hosted SMTP (if Gmail fails)

**SMS Service Fallback:**
1. Twilio (primary)
2. Exotel (if Twilio fails)
3. MSG91 (if Exotel fails)

### Cost Estimation per API

**Monthly Cost Estimate (1000 users):**
- PayAid Payments: Transaction fees (varies)
- SendGrid: ~₹500-2000/month
- Twilio SMS: ~₹500-5000/month (based on volume)
- Groq API: ~₹1000-5000/month (based on usage)
- **Total:** ~₹2000-12000/month

**Self-Hosted Alternative Cost:**
- Ollama (LLM): ₹0 (requires GPU server)
- Postfix (Email): ₹0 (requires mail server)
- WAHA (WhatsApp): ₹0 (requires server)
- **Total:** ₹0 (infrastructure costs only)

---

## 5. Open Source & Paid Services

### Open Source (Free)

**Frontend:**
- React (MIT)
- Next.js (MIT)
- Tailwind CSS (MIT)
- Zustand (MIT)

**Backend:**
- Node.js (MIT)
- Prisma (Apache 2.0)
- PostgreSQL (PostgreSQL License)
- Redis (BSD)

**AI/ML:**
- Ollama (MIT)
- HuggingFace Transformers (Apache 2.0)
- Sentence Transformers (Apache 2.0)

**Infrastructure:**
- Docker (Apache 2.0)
- Nginx (BSD)
- Let's Encrypt (Free SSL)

**Monitoring:**
- Prometheus (Apache 2.0)
- Grafana (Apache 2.0)
- Loki (Apache 2.0)

### Paid Services to Avoid

**Replaced by Free Alternatives:**
- ❌ Stripe → PayAid Payments (exclusive)
- ❌ Razorpay → PayAid Payments (exclusive)
- ❌ SendGrid → Gmail SMTP or Postfix (free)
- ❌ Auth0 → Built-in JWT auth (free)
- ❌ Datadog → Prometheus + Grafana (free)
- ❌ PagerDuty → Self-hosted alerts (free)

### License Compliance

**License Types:**
- MIT: Permissive, commercial use allowed
- Apache 2.0: Permissive, patent grant
- BSD: Permissive, commercial use allowed
- PostgreSQL License: Permissive, similar to MIT

**Compliance:**
- All dependencies documented in `package.json`
- License files included
- No GPL dependencies (to avoid copyleft)

---

## Summary

PayAid V3 integrates with external services for payments, communication, and AI capabilities. The platform prioritizes self-hosted and free alternatives where possible, with paid services only when necessary.

**Key Integrations:**
- ✅ PayAid Payments (exclusive, required)
- ✅ Email (SendGrid/Gmail SMTP/Postfix)
- ✅ SMS (Twilio/Exotel/MSG91)
- ✅ WhatsApp (WAHA self-hosted/Twilio)
- ✅ AI Services (Groq/Ollama/HuggingFace)

**Cost Optimization:**
- Self-hosted alternatives available
- Free tiers utilized where possible
- Fallback chains for reliability
- No vendor lock-in
