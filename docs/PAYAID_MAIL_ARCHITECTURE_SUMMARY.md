# PayAid Mail - Architecture Summary

**Quick Reference Guide**  
**Date:** April 23, 2026

---

## Current State

### ✅ Already Implemented
- Gmail OAuth integration (`lib/email/gmail.ts`)
- Outlook OAuth integration (in `sync-service.ts`)
- Unified sync service with CRM linking
- Email database schema (accounts, folders, messages, attachments)
- Campaign tracking schema
- Email template library
- AI email automation (response generation, categorization)
- SendGrid fallback integration
- Email tracking infrastructure (open/click pixel injection)

### 🟡 Partially Complete
- Campaign UI (builder exists, backend incomplete)
- Email tracking (injection exists, event processing missing)
- Background workers (code exists, not fully deployed)

### ❌ Missing
- Self-hosted SMTP infrastructure (Postfix/Dovecot)
- Generic IMAP/SMTP connection (non-Gmail/Outlook)
- Campaign sending engine with throttling
- Deliverability monitoring dashboard
- DNS management UI
- Abuse handling workflow
- Complete API endpoints

---

## Architecture Decision

**Two-Lane Architecture:**

1. **Connect External Inboxes** (Gmail, Outlook, custom IMAP)
   - OAuth for Gmail/Outlook
   - IMAP/SMTP for other providers
   - Sync to PayAid database
   - Link to CRM automatically

2. **Self-Hosted Outbound Stack**
   - mailcow (Postfix + Dovecot + Rspamd + SOGo)
   - Send system emails, campaigns, proposals
   - Control deliverability
   - Zero external API costs

---

## Stack Choice

### Recommended: mailcow

**Components:**
- Postfix (SMTP)
- Dovecot (IMAP/auth)
- Rspamd (anti-spam)
- SOGo (webmail, optional)
- ClamAV (antivirus)

**Why mailcow:**
- All-in-one package
- Docker-based
- Web admin UI
- Active maintenance
- Built-in DKIM/DMARC
- API for automation

**Cost:** ~₹2,900-₹4,150/month per tenant vs ₹7,500+/month for SendGrid

---

## Implementation Phases

### Phase 1: Mail Connect + CRM Send (2-3 weeks)
**Goal:** Connect Gmail/Outlook and send from CRM/Finance

**Tasks:**
- Complete API endpoints (account CRUD, send, sync)
- Deploy Bull queue workers
- Integrate with CRM (send button, timeline logging)
- Integrate with Finance (invoice/quote send)

**Success:**
- Users can connect Gmail/Outlook
- Send emails from CRM/Finance
- Emails logged to timeline
- Inbox synced every 5 minutes

### Phase 2: Self-Hosted Outbound (3-4 weeks)
**Goal:** Deploy mailcow for PayAid-owned sending

**Tasks:**
- Deploy mailcow stack
- Configure DNS (SPF, DKIM, DMARC)
- Setup bounce processing
- Build deliverability dashboard
- Build DNS management UI

**Success:**
- Self-hosted SMTP operational
- System emails sent via PayAid Mail
- Deliverability monitoring live
- Bounce rate < 2%

### Phase 3: Campaign Engine (4-5 weeks)
**Goal:** Full marketing campaign capability

**Tasks:**
- Campaign sending with rate limiting
- Open/click tracking backend
- Unsubscribe management
- Campaign analytics dashboard
- A/B testing

**Success:**
- Campaigns send successfully
- Open/click rates tracked
- Unsubscribe rate < 0.5%
- Zero spam complaints

### Phase 4: Generic IMAP/SMTP (2-3 weeks)
**Goal:** Support any email provider

**Tasks:**
- Generic IMAP sync
- Generic SMTP send
- Auto-detect settings
- Connection testing

**Success:**
- Any IMAP/SMTP provider works
- Custom domains supported

### Phase 5: Advanced Features (6-8 weeks)
**Goal:** Power user features

**Tasks:**
- Shared inboxes
- Drag-drop email builder
- Email automation workflows
- (Optional) Full hosted mailbox

---

## Data Model Summary

### Core Tables (Existing)
```
EmailAccount
├── id, tenantId, userId, email
├── provider (gmail | outlook | custom | payaid)
├── providerCredentials (encrypted OAuth or IMAP/SMTP)
├── lastSyncAt
└── folders[], messages[]

EmailFolder
├── id, accountId, name
├── type (inbox | sent | drafts | custom)
└── messages[]

EmailMessage
├── id, accountId, folderId
├── messageId, threadId, inReplyTo
├── fromEmail, toEmails, subject, body
├── contactId (link to CRM)
└── attachments[]

Campaign
├── id, tenantId, name, type
├── subject, content
├── status (draft | scheduled | sending | sent)
└── metrics (sent, opened, clicked, bounced)
```

### New Tables Needed
```
EmailSendJob
├── id, tenantId, accountId
├── toEmails, subject, htmlBody
├── status (pending | processing | sent | failed)
├── campaignId, contactId, dealId
└── scheduledFor, sentAt

EmailTrackingEvent
├── id, messageId, contactId, campaignId
├── eventType (open | click | bounce | spam)
└── timestamp, ipAddress, userAgent

EmailSyncCheckpoint
├── accountId, provider
├── lastSyncAt, lastMessageId
└── syncToken (Gmail historyId, Outlook delta)

EmailDeliverabilityLog
├── tenantId, sendingDomain, date
├── sent, delivered, bounced, spamReports
└── bounceRate, spamRate
```

---

## Key Flows

### CRM Email Send
```
User clicks Send → Select template → Attach document →
Compose email → Choose account (Gmail/Outlook/PayAid) →
Send via provider API → Log to sent folder →
Create CRM activity → Link to contact/deal →
Track opens/clicks
```

### Campaign Send
```
Create campaign → Select segment → Resolve recipients →
Apply suppression → Schedule → Batch recipients →
Queue send jobs → Send worker processes →
Send via PayAid Mail → Track events → Update metrics
```

### Gmail Sync
```
Check sync checkpoint → Fetch history since last sync →
Process new messages → Parse headers/body →
Create EmailMessage records → Link to contacts →
Update checkpoint → Schedule next sync
```

---

## API Endpoints Needed

### Email Accounts
- `POST /api/email/accounts/connect` - OAuth flow
- `GET /api/email/accounts/callback` - OAuth callback
- `GET /api/email/accounts` - List accounts
- `DELETE /api/email/accounts/:id` - Disconnect
- `POST /api/email/accounts/:id/sync` - Manual sync

### Email Operations
- `POST /api/email/send` - Send single email
- `GET /api/email/messages` - List messages
- `GET /api/email/messages/:id` - Get message
- `POST /api/email/messages/:id/reply` - Reply

### Campaigns
- `GET /api/marketing/email-campaigns` - List campaigns
- `POST /api/marketing/email-campaigns` - Create campaign
- `GET /api/marketing/email-campaigns/:id` - Get campaign
- `POST /api/marketing/email-campaigns/:id/send` - Send campaign
- `GET /api/marketing/email-campaigns/:id/analytics` - Analytics

### Tracking
- `GET /api/email/tracking/pixel/:id` - Tracking pixel
- `GET /api/email/tracking/link/:id` - Link tracking
- `POST /api/email/tracking/event` - Event ingestion

### Admin
- `GET /api/admin/email/deliverability` - Deliverability dashboard
- `POST /api/admin/email/dns/check` - DNS health check
- `GET /api/admin/email/queue/stats` - Queue statistics

---

## Background Jobs

### Email Sync (every 5 minutes)
```typescript
emailSyncQueue.add({ accountId }, { repeat: { every: 300000 } })
```

### Email Send (on-demand)
```typescript
emailSendQueue.add({ 
  accountId, toEmails, subject, htmlBody, 
  contactId, campaignId, trackingEnabled 
})
```

### Campaign Send (scheduled)
```typescript
campaignQueue.add({ 
  campaignId, batchSize: 100 
}, { delay: campaignStartTime })
```

### Deliverability Monitor (daily)
```typescript
deliverabilityQueue.add({ }, { repeat: { cron: '0 9 * * *' } })
```

---

## Security Checklist

- [ ] Encrypt OAuth tokens at rest (AES-256)
- [ ] Encrypt IMAP/SMTP passwords at rest
- [ ] Use secure credential vault
- [ ] Implement rate limiting (per tenant)
- [ ] Validate email addresses before sending
- [ ] Sanitize HTML content (XSS prevention)
- [ ] SPF/DKIM/DMARC configured
- [ ] TLS/STARTTLS for all connections
- [ ] Audit log all email sends
- [ ] GDPR-compliant unsubscribe
- [ ] CAN-SPAM compliance
- [ ] Bounce/complaint handling
- [ ] Abuse monitoring

---

## DNS Configuration

### Required Records
```dns
; SPF
@ IN TXT "v=spf1 ip4:YOUR_SERVER_IP include:_spf.payaid.io ~all"

; DKIM
default._domainkey IN TXT "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"

; DMARC
_dmarc IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@payaid.io"

; MX
@ IN MX 10 mail.payaid.io.

; PTR
YOUR_SERVER_IP IN PTR mail.payaid.io.
```

---

## Performance Guidelines

### Do's ✅
- Use background workers for sync/send
- Index messages for fast search
- Store attachments in object storage
- Use Redis for rate limiting
- Cache frequently accessed data
- Use database connection pooling
- Implement retry logic with backoff

### Don'ts ❌
- Never fetch mail in request cycle
- Never block on external API calls
- Never store large attachments in database
- Never send campaigns synchronously
- Never skip rate limiting
- Never ignore bounce/complaint feedback

---

## Monitoring Metrics

### Email Operations
- Sync latency (target: < 5 min)
- Send success rate (target: > 98%)
- Queue length (target: < 100)
- Worker processing time (target: < 5s)

### Deliverability
- Bounce rate (target: < 2%)
- Spam complaint rate (target: < 0.1%)
- Open rate (benchmark: 15-25%)
- Click rate (benchmark: 2-5%)

### Infrastructure
- SMTP server uptime (target: > 99.5%)
- Queue depth (target: < 1000)
- Failed job rate (target: < 1%)
- DNS health score (target: 100%)

---

## Cost Comparison

### Self-Hosted (Recommended)
- VPS: ₹1,650-₹3,300/month
- Object storage: ₹415-₹830/month
- Monitoring: Free (self-hosted)
- **Total: ~₹2,900-₹4,150/month per tenant**

### External API (Avoid)
- SendGrid: ₹7,500+/month
- Mailgun: ₹2,900+/month
- Twilio: ₹1,250+/month
- **Total: ₹2,900-₹7,500+/month per tenant**

**Savings:** ~₹29,900-₹89,700/year per tenant with self-hosted

---

## Next Steps

1. **Week 1:** Deploy mailcow, configure DNS
2. **Week 2:** Complete API endpoints
3. **Week 3:** Setup Bull workers
4. **Week 4:** CRM/Finance integration
5. **Week 5:** Test Gmail/Outlook flow
6. **Week 6:** UI polish
7. **Week 7:** Monitoring setup
8. **Week 8:** Production deployment

---

## Success Criteria

### Phase 1 (Mail Connect)
- [x] Gmail OAuth working
- [x] Outlook OAuth working
- [ ] Email send from CRM
- [ ] Email send from Finance
- [ ] Timeline logging
- [ ] 90% connection success rate

### Phase 2 (Self-Hosted)
- [ ] mailcow deployed
- [ ] DNS configured
- [ ] Bounce processing
- [ ] Deliverability dashboard
- [ ] < 2% bounce rate

### Phase 3 (Campaigns)
- [ ] Campaign sending
- [ ] Open/click tracking
- [ ] Unsubscribe management
- [ ] Analytics dashboard
- [ ] > 95% send success rate

---

**For detailed implementation, see:**
[PAYAID_MAIL_IMPLEMENTATION_PLAN.md](./PAYAID_MAIL_IMPLEMENTATION_PLAN.md)

**Status:** 🔵 Ready to Begin Phase 1  
**Owner:** Engineering Team
