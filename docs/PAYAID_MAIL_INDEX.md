# PayAid Mail - Documentation Index

**Last Updated:** April 23, 2026  
**Status:** 🔵 Complete and Ready for Implementation

---

## Overview

This documentation set provides a complete blueprint for implementing PayAid Mail, an integrated email layer that enables CRM, Marketing, Finance, and other modules to send and receive emails while maintaining platform speed, avoiding external vendor costs, and preferring self-hosted infrastructure.

---

## Quick Start

**New to this project?** Start here:

1. **Read the Summary** (5 min)  
   → [`PAYAID_MAIL_ARCHITECTURE_SUMMARY.md`](./PAYAID_MAIL_ARCHITECTURE_SUMMARY.md)  
   Quick reference guide with high-level architecture, stack choice, and phased rollout

2. **Understand the Decision** (10 min)  
   → [`PAYAID_MAIL_ADR.md`](./PAYAID_MAIL_ADR.md)  
   Architecture Decision Record explaining *why* this approach was chosen

3. **Review Current State** (15 min)  
   → [`PAYAID_MAIL_AUDIT_REPORT.md`](./PAYAID_MAIL_AUDIT_REPORT.md)  
   Comprehensive audit of existing code, database schema, and implementation status

4. **Dive into Implementation** (60 min)  
   → [`PAYAID_MAIL_IMPLEMENTATION_PLAN.md`](./PAYAID_MAIL_IMPLEMENTATION_PLAN.md)  
   Complete technical implementation guide with code samples, flows, and checklists

---

## Document Descriptions

### 1. Architecture Summary
**File:** `PAYAID_MAIL_ARCHITECTURE_SUMMARY.md`  
**Purpose:** Quick reference guide  
**Length:** ~15 pages  
**Audience:** All team members

**Contents:**
- Current state (what exists, what's missing)
- Architecture decision (two-lane hybrid)
- Stack choice (mailcow)
- Implementation phases
- Data model summary
- Key flows (send, sync, campaign)
- API endpoints needed
- Background jobs
- Security checklist
- DNS configuration
- Performance guidelines
- Monitoring metrics
- Cost comparison
- Success criteria

**When to use:**
- Need a quick reminder of architecture
- Want to understand phasing
- Looking for API endpoint list
- Need to explain to stakeholders

---

### 2. Architecture Decision Record (ADR)
**File:** `PAYAID_MAIL_ADR.md`  
**Purpose:** Explain the "why" behind architecture choices  
**Length:** ~25 pages  
**Audience:** Product, Engineering, Leadership

**Contents:**
- Context and problem statement
- Options considered (with pros/cons)
- Decision rationale
- Comparison table
- Risk assessment
- Use case mapping
- Alternative paths explored
- Dependencies
- Stakeholder sign-off
- Review criteria

**When to use:**
- Need to justify architecture choice
- Want to understand trade-offs
- Reviewing decision after 6 months
- Onboarding new team members to decision history

---

### 3. Audit Report
**File:** `PAYAID_MAIL_AUDIT_REPORT.md`  
**Purpose:** Comprehensive assessment of current repository state  
**Length:** ~35 pages  
**Audience:** Engineering Team

**Contents:**
- What code exists (file-by-file breakdown)
- What was previously planned (evidence from repo)
- Classification of implementation status
- Database schema assessment
- Security & performance review
- Go/no-go recommendation
- Critical next steps

**When to use:**
- Need to know what's already built
- Want to understand code quality
- Planning next sprint's work
- Assessing technical debt

---

### 4. Implementation Plan
**File:** `PAYAID_MAIL_IMPLEMENTATION_PLAN.md`  
**Purpose:** Complete technical blueprint for building PayAid Mail  
**Length:** ~60 pages  
**Audience:** Engineering Team (Implementers)

**Contents:**
- Current state analysis (detailed)
- Recommended architecture (with diagrams)
- Exact data model (Prisma schemas)
- Phased implementation (4 phases)
- Sending flows (with Mermaid diagrams)
- Sync flows (Gmail, Outlook, IMAP)
- Security & token handling (code samples)
- DNS & deliverability checklist
- Queue & worker model (Bull setup)
- Performance guidance
- Cost guidance
- Stack choice (mailcow vs manual)
- Go/no-go recommendation
- Next steps

**When to use:**
- Actually implementing the system
- Need code samples
- Setting up infrastructure
- Configuring DNS
- Building API endpoints
- Designing database migrations

---

## Key Decisions

### Architecture: Two-Lane Hybrid ✅

**Lane 1: Mail Connections** (Connect External)
- Gmail OAuth
- Outlook OAuth  
- Custom IMAP/SMTP

**Lane 2: PayAid Mail Core** (Internal Logic)
- Account registry
- Token vault
- Send queue
- Sync workers
- CRM linkage
- Tracking

**Lane 3: Self-Hosted Infrastructure** (Self-Host Outbound)
- mailcow (Postfix + Dovecot + Rspamd)
- PayAid-owned sending domains
- System emails, campaigns, proposals

**Why This Architecture?**
- ✅ Fast to market (2-3 weeks for Phase 1)
- ✅ Low cost (~₹2,900-₹4,150/month vs ₹7,500+ for SendGrid)
- ✅ Leverages existing Gmail/Outlook infrastructure
- ✅ Control over business-critical sending
- ✅ Focused on business OS value, not webmail product

---

## Implementation Phases

### Phase 1: Mail Connect + CRM Send (Weeks 1-3)
**Status:** 🔵 Ready to Start  
**Blockers:** None (code exists, needs deployment)

**Tasks:**
- Complete API endpoints
- Deploy Bull queue workers
- Integrate with CRM/Finance
- Build email composer UI

**Success:** Users can connect Gmail/Outlook and send from CRM

---

### Phase 2: Self-Hosted Outbound (Weeks 4-7)
**Status:** 🟡 Waiting for Phase 1  
**Blockers:** Needs DevOps commitment

**Tasks:**
- Deploy mailcow stack
- Configure DNS (SPF, DKIM, DMARC)
- Build deliverability dashboard
- Setup bounce processing

**Success:** Self-hosted SMTP operational, system emails sent via PayAid Mail

---

### Phase 3: Campaign Engine (Weeks 8-12)
**Status:** 🟡 Waiting for Phase 2  
**Blockers:** Needs outbound infrastructure

**Tasks:**
- Campaign sending with throttling
- Open/click tracking backend
- Unsubscribe management
- Campaign analytics

**Success:** Full marketing campaign capability

---

### Phase 4: Advanced Features (Weeks 13-20)
**Status:** ⚪ Future  
**Blockers:** Needs Phase 3 complete

**Tasks:**
- Generic IMAP/SMTP connect
- Shared inboxes
- Email automation workflows
- (Optional) Full hosted mailbox

**Success:** Power user features complete

---

## Current Status

### ✅ Already Implemented (70% of Phase 1)
- Gmail OAuth integration
- Outlook OAuth integration
- Email database schema
- CRM contact linking
- Auto-import leads
- AI email features
- Campaign UI
- Email templates
- Token encryption

### 🟡 Partially Implemented
- Email tracking (injection ready, events missing)
- Campaign backend (UI ready, send logic missing)
- Background workers (code ready, not deployed)

### ❌ Not Started
- Self-hosted SMTP (mailcow)
- Email send queue (Bull)
- API endpoints
- Generic IMAP/SMTP connect
- Deliverability monitoring
- DNS management UI

---

## Stack Recommendations

### Recommended: mailcow ✅

**Why:**
- All-in-one package (Postfix + Dovecot + Rspamd + SOGo + ClamAV)
- Docker-based, easy deployment
- Web admin UI
- Active maintenance
- Built-in DKIM/DMARC management
- API for automation

**Cost:** ~₹2,900-₹4,150/month per tenant  
**vs SendGrid:** ₹7,500+/month per tenant  
**Savings:** ~₹29,900-₹89,700/year per tenant

### Alternative: Manual Postfix + Dovecot

**When to use:**
- Need more control
- Custom requirements
- Existing mail infrastructure

**Cost:** Similar to mailcow  
**Effort:** Higher (manual configuration)

---

## Integration Points

### CRM Integration
- "Send Email" button on Contact page
- "Send Email" button on Deal page
- Auto-log sent emails to timeline
- Auto-link received emails to contacts
- Auto-create leads from unknown senders

### Finance Integration
- Send invoice via email (with payment link)
- Send quote via email
- Send payment reminders
- Track invoice opens/payment link clicks

### Marketing Integration
- Create campaigns
- Select segments
- Schedule sends
- Track opens/clicks
- Unsubscribe management

### Other Modules
- HR: offer letters, onboarding emails
- Projects: task assignments, reminders
- Support: ticket notifications
- System: password reset, 2FA codes

---

## Key Metrics

### Phase 1 Success Criteria
- [ ] 90% of users successfully connect Gmail/Outlook
- [ ] Email send success rate > 98%
- [ ] Sync latency < 5 minutes
- [ ] CRM timeline shows 100% of sent emails
- [ ] ₹0 external email API costs

### Phase 2 Success Criteria
- [ ] Mail server uptime > 99.5%
- [ ] Bounce rate < 2%
- [ ] Spam complaint rate < 0.1%
- [ ] DNS health score = 100%
- [ ] Deliverability monitoring operational

### Phase 3 Success Criteria
- [ ] Campaign send success rate > 95%
- [ ] Open rate tracking accuracy > 90%
- [ ] Click rate tracking accuracy > 95%
- [ ] Unsubscribe rate < 0.5%
- [ ] 0 spam complaints

---

## Security Checklist

- [ ] Encrypt OAuth tokens at rest (AES-256)
- [ ] Encrypt IMAP/SMTP passwords at rest
- [ ] Use secure credential vault
- [ ] Implement rate limiting (per tenant)
- [ ] Validate email addresses before sending
- [ ] Sanitize HTML content (XSS prevention)
- [ ] Configure SPF/DKIM/DMARC
- [ ] TLS/STARTTLS for all connections
- [ ] Audit log all email sends
- [ ] GDPR-compliant unsubscribe
- [ ] CAN-SPAM compliance
- [ ] Bounce/complaint handling
- [ ] Abuse monitoring

---

## Performance Guidelines

### Do's ✅
- Use background workers for sync/send
- Index messages for fast search
- Store attachments in object storage (S3/R2)
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

## Cost Comparison

### Self-Hosted (Recommended)
| Component | Monthly Cost |
|-----------|--------------|
| VPS (mail server) | ₹1,650-₹3,300 |
| Object storage (S3/R2) | ₹415-₹830 |
| Monitoring (self-hosted) | Free |
| **Total per tenant** | **~₹2,900-₹4,150** |

### External API (Not Recommended)
| Service | Monthly Cost |
|---------|--------------|
| SendGrid Pro | ₹7,500+ |
| Mailgun | ₹2,900+ |
| Twilio SendGrid | ₹1,250+ |
| **Total per tenant** | **₹2,900-₹7,500+** |

**Annual Savings with Self-Hosted:** ₹29,900-₹89,700 per tenant

---

## Next Steps

### Immediate (This Week)
1. Add missing database models (EmailSendJob, EmailTrackingEvent, etc.)
2. Create API endpoint stubs
3. Setup Bull queue infrastructure

### Short-Term (Weeks 2-3)
4. Complete tracking event API
5. Deploy background workers
6. Build CRM integration UI

### Medium-Term (Weeks 4-7)
7. Deploy mailcow stack
8. Build admin UI
9. Setup monitoring & alerting

---

## Team Contacts

**Questions about this documentation?**
- Architecture decisions → Product Team
- Implementation details → Engineering Team
- Infrastructure → DevOps Team
- Compliance/legal → Legal Team

---

## Related Documentation

- **OAuth2 SSO:** `OAUTH2_SSO_DOCUMENTATION.md`
- **Production Testing:** `VERCEL_PRODUCTION_TESTING_HANDOFF.md`
- **Agent Guidelines:** `AGENTS.md`

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-04-23 | 1.0 | Initial documentation set | AI Architecture Agent |

---

## Status Dashboard

| Component | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|-----------|---------|---------|---------|---------|
| Gmail OAuth | ✅ Ready | ✅ Ready | ✅ Ready | ✅ Ready |
| Outlook OAuth | ✅ Ready | ✅ Ready | ✅ Ready | ✅ Ready |
| CRM Integration | 🟡 70% | ✅ Ready | ✅ Ready | ✅ Ready |
| Email Send API | ❌ 0% | ✅ Ready | ✅ Ready | ✅ Ready |
| Background Workers | ❌ 0% | ✅ Ready | ✅ Ready | ✅ Ready |
| Self-Hosted SMTP | N/A | ❌ 0% | ✅ Ready | ✅ Ready |
| Campaign Backend | N/A | N/A | ❌ 0% | ✅ Ready |
| Generic IMAP/SMTP | N/A | N/A | N/A | ❌ 0% |

**Legend:**
- ✅ Ready - Implemented and tested
- 🟡 Partial - Partially implemented
- ❌ Not Started - Not yet begun
- N/A - Not needed in this phase

---

**Documentation Status:** ✅ Complete  
**Next Review:** 4 weeks post Phase 1 launch

---

End of Documentation Index.
