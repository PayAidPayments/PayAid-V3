# PayAid Mail - Architecture Decision Record

**Decision Date:** April 23, 2026  
**Status:** ✅ **Accepted**  
**Decision Makers:** Product + Engineering Team

**Cost conversion note:** INR estimates in this document use **USD 1 ≈ ₹83** (rounded, Apr 2026).

---

## Context

PayAid V3 needs an integrated email layer to support:
- **CRM:** Send proposals, log communications, track engagement
- **Marketing:** Send campaigns, measure open/click rates
- **Finance:** Send invoices, quotes, payment reminders
- **HR:** Send offer letters, onboarding emails
- **General:** System notifications, transactional emails

The email system must meet these constraints:
1. **No platform slowdown** - Email cannot block core operations
2. **No vendor cost** - Avoid paid SaaS email APIs where possible
3. **Self-hosted preference** - Own infrastructure for control
4. **Fast time to market** - Ship value quickly
5. **CRM integration** - Auto-link emails to contacts/deals

---

## Problem Statement

**The Question:**  
Should PayAid build a full self-hosted email product (like Gmail/Zoho), use external APIs (SendGrid/Mailgun), or take a hybrid approach?

**The Dilemma:**
- Building a full email product is a massive undertaking (mailbox hosting, webmail UI, mobile apps, spam filtering, deliverability ops)
- Using external APIs is expensive and doesn't meet the "no vendor cost" constraint
- Users already have Gmail/Outlook for personal email - why duplicate that?
- PayAid's core value is business operations, not being an email provider

---

## Options Considered

### Option 1: Full Self-Hosted Email Product (Like Gmail/Zoho)

**Description:**
Build a complete email hosting product with webmail UI, mailbox provisioning, mobile support, spam filtering, and full inbox management.

**Pros:**
- Complete control
- No external dependencies
- Could be sold as standalone product
- Full customization

**Cons:**
- ❌ **Massive development effort** (6+ months)
- ❌ **Heavy operational burden** (spam reputation, abuse, deliverability)
- ❌ **Distracts from core business OS value**
- ❌ **High risk of poor deliverability** if not managed correctly
- ❌ **Users already have email** (Gmail/Outlook) - duplication
- ❌ **Mobile apps, webmail UI** - entire product to maintain
- ❌ **Not the core value proposition** of PayAid

**Decision:** ❌ **Rejected for v1** (can revisit later if needed)

---

### Option 2: External Email API (SendGrid/Mailgun/SES)

**Description:**
Use paid third-party email sending APIs for all outbound email.

**Pros:**
- Fast to implement
- Managed deliverability
- Good documentation
- Reliable infrastructure

**Cons:**
- ❌ **₹2,900-₹7,500+ per tenant per month** - violates "no vendor cost" constraint
- ❌ **Less control** over deliverability
- ❌ **Vendor lock-in**
- ❌ **Limited customization**
- ❌ **Data privacy concerns** (emails pass through third-party)
- ❌ **Cost scales linearly** with usage

**Decision:** ❌ **Rejected** (fails cost constraint)

---

### Option 3: Hybrid - Connect External + Self-Host Outbound ✅

**Description:**
Two-lane architecture:
1. **Connect external inboxes** (Gmail/Outlook/IMAP) via OAuth/IMAP - sync to PayAid
2. **Self-hosted outbound stack** (mailcow/Postfix) - send PayAid-owned mail

**Pros:**
- ✅ **Fast to market** - leverage existing Gmail/Outlook
- ✅ **Low cost** - self-host outbound, use customer's Gmail for personal
- ✅ **Best of both worlds** - sync convenience + sending control
- ✅ **Focused scope** - optimize for CRM/Marketing sending, not webmail
- ✅ **Operational simplicity** - no full mailbox hosting
- ✅ **Immediate value** - users can connect Gmail today
- ✅ **Self-hosted where it matters** - control outbound for campaigns/invoices
- ✅ **No duplication** - don't rebuild what Gmail already does well

**Cons:**
- ⚠️ **Dual infrastructure** - both external API integration and self-hosted
- ⚠️ **Operational overhead** - maintain mail server
- ⚠️ **Deliverability management** - need monitoring and SPF/DKIM/DMARC

**Decision:** ✅ **ACCEPTED** - Best balance of speed, cost, and control

---

## Decision

**Architecture:** External Inbox Connect + Self-Hosted Outbound

### Lane 1: Mail Connections (External)
- Connect Gmail accounts via OAuth2
- Connect Outlook accounts via OAuth2
- Connect custom IMAP/SMTP accounts
- Sync inbox to PayAid database
- Auto-link emails to CRM contacts
- Send via connected account when needed

### Lane 2: PayAid Mail Core (Internal)
- Account registry
- Token vault (encrypted credentials)
- Send queue (Bull/Redis)
- Sync workers (background jobs)
- Threading engine
- Attachment store (S3/R2)
- Delivery/activity logs
- CRM linkage

### Lane 3: Self-Hosted Infrastructure (Self-Hosted)
- mailcow stack (Postfix + Dovecot + Rspamd + SOGo)
- PayAid-owned sending domains
- System emails (notifications, invoices)
- Marketing campaigns
- CRM sequences
- SPF/DKIM/DMARC management
- Bounce processing
- Deliverability monitoring

---

## Rationale

### Why NOT "Build Gmail from Scratch"?

1. **Not the core value proposition**
   - PayAid is a business OS, not an email provider
   - Users already have Gmail/Outlook
   - Duplicating Gmail doesn't add unique value

2. **Massive engineering distraction**
   - Full webmail UI (6+ months)
   - Mobile apps (3+ months each)
   - Spam filtering operations (ongoing)
   - Deliverability reputation management (full-time job)
   - Abuse handling (legal/compliance burden)

3. **High operational burden**
   - Mailbox hosting at scale is hard
   - Spam reputation takes months to build
   - One bad actor can tank entire domain reputation
   - 24/7 monitoring required
   - Compliance burden (GDPR, CAN-SPAM, etc.)

4. **Slow time to market**
   - 6-12 months to MVP
   - 12+ months to production-ready
   - Delays core business OS features

### Why External Inbox Connect?

1. **Users already have email**
   - 90% of business users have Gmail or Office 365
   - They don't want another inbox to check
   - They want PayAid to work WITH their existing email

2. **Fastest time to value**
   - Gmail OAuth exists and works
   - Outlook OAuth exists and works
   - Users can connect in < 2 minutes
   - Immediate inbox sync

3. **Leverage existing infrastructure**
   - Google/Microsoft handle spam filtering
   - Google/Microsoft handle deliverability
   - Google/Microsoft handle storage quotas
   - PayAid adds CRM integration on top

4. **Zero hosting cost for personal mail**
   - Customer's Gmail = customer's infrastructure
   - PayAid only stores metadata
   - Attachments stored in PayAid S3 (opt-in)

### Why Self-Hosted Outbound?

1. **Cost savings**
   - ~₹2,900-₹4,150/month per tenant self-hosted
   - vs ₹7,500+/month for SendGrid
   - ₹29,900-₹89,700/year savings per tenant
   - Scales better than per-email pricing

2. **Control over deliverability**
   - Own sender reputation
   - Control DNS records
   - Manage IP reputation
   - Respond to deliverability issues quickly

3. **Compliance-friendly**
   - Full audit logs
   - Data never leaves PayAid infrastructure
   - GDPR-compliant
   - Customer data sovereignty

4. **Better for campaigns**
   - Dedicated IPs for marketing
   - Warm-up control
   - Rate limiting control
   - Segmented by tenant

5. **No vendor lock-in**
   - Open-source stack (mailcow)
   - Portable infrastructure
   - No API migration if vendor changes pricing

---

## Use Cases & Mapping

### Use Case: CRM User Sends Proposal
**Solution:** 
- User clicks "Send Email" in CRM
- Choose connected Gmail account OR PayAid Mail account
- Send via Gmail API (if Gmail) OR Postfix (if PayAid)
- Log to CRM timeline
- Track opens/clicks

**Why This Architecture?**
- Flexibility: use personal Gmail or company PayAid Mail
- CRM integration: auto-logs to contact timeline
- Tracking: know when proposal is opened

### Use Case: Finance Module Sends Invoice
**Solution:**
- Invoice generated with payment link
- Send via PayAid Mail (not personal Gmail)
- Render invoice PDF, attach to email
- Use template with payment button
- Track payment link clicks

**Why This Architecture?**
- Professional: sent from `billing@customerdomain.com`
- Reliable: dedicated sending infrastructure
- Compliant: full audit log of invoice sends

### Use Case: Marketing Campaign to 10,000 Contacts
**Solution:**
- Create campaign in Marketing module
- Select segment (e.g., "Trial Users")
- Schedule send
- Send via PayAid Mail (dedicated IP)
- Throttle sending (avoid spam triggers)
- Track opens/clicks/unsubscribes
- Monitor bounce rate

**Why This Architecture?**
- Scalable: self-hosted can handle 10k+ emails
- Controlled: rate limiting, warm-up, monitoring
- Cost-effective: no per-email charges
- Compliant: unsubscribe handling, bounce processing

### Use Case: User Wants to Read Email in PayAid
**Solution:**
- Sync inbox from Gmail/Outlook via OAuth
- Display in PayAid email viewer
- Show linked CRM contact
- Show linked deals
- Allow reply from PayAid UI

**Why This Architecture?**
- Convenience: single pane of glass
- Context: see CRM data alongside email
- No duplication: still using Gmail for storage

---

## Comparison Table

| Feature | Full Self-Hosted | External API | Hybrid (CHOSEN) |
|---------|------------------|--------------|-----------------|
| Time to market | ❌ 6-12 months | ✅ 1-2 weeks | ✅ 2-4 weeks |
| Monthly cost | ⚠️ ₹4,150-₹8,300 | ❌ ₹7,500+ | ✅ ₹2,900-₹4,150 |
| Operational burden | ❌ Very High | ✅ Low | ⚠️ Medium |
| Control | ✅ Full | ❌ Limited | ✅ High |
| Deliverability | ⚠️ DIY | ✅ Managed | ✅ Controlled |
| User experience | ⚠️ New inbox | ⚠️ No inbox | ✅ Integrated |
| CRM integration | ✅ Full | ⚠️ Limited | ✅ Full |
| Personal mail | ❌ Duplicate | ❌ N/A | ✅ Use Gmail |
| Campaign sending | ✅ Full | ✅ Full | ✅ Full |
| Cost at scale | ✅ Fixed | ❌ High | ✅ Low |

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Poor deliverability | Medium | High | Monitor metrics, gradual warm-up, SPF/DKIM/DMARC |
| Gmail API limits | Low | Medium | Respect rate limits, batch requests |
| Mail server downtime | Low | High | Monitoring, failover, queue persistence |
| Spam complaints | Medium | High | Unsubscribe links, complaint processing, list hygiene |
| OAuth token revocation | Low | Medium | Token refresh, re-auth UI |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| IP blacklisting | Medium | High | Monitor blacklists, appeal process, backup IPs |
| DNS misconfiguration | Low | High | Automated DNS checks, monitoring |
| Storage overflow | Low | Medium | Attachment limits, S3 lifecycle policies |
| Queue backup | Medium | Medium | Alert on queue depth, auto-scaling workers |
| Bounce rate spike | Medium | High | Real-time monitoring, auto-pause campaigns |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| User adoption low | Low | Medium | Good UX, onboarding, documentation |
| Support burden | Medium | Medium | Self-service docs, admin UI, monitoring |
| Compliance issues | Low | High | Legal review, GDPR compliance, audit logs |
| Cost underestimate | Low | Medium | Monitor actual costs, adjust pricing |

---

## Success Metrics

### Phase 1 (Mail Connect)
- 90% of users successfully connect Gmail/Outlook
- Email send success rate > 98%
- Sync latency < 5 minutes
- CRM timeline shows 100% of sent emails
- Zero external email API costs

### Phase 2 (Self-Hosted)
- Mail server uptime > 99.5%
- Bounce rate < 2%
- Spam complaint rate < 0.1%
- DNS health score = 100%
- Deliverability monitoring operational

### Phase 3 (Campaigns)
- Campaign send success rate > 95%
- Open rate tracking accuracy > 90%
- Click rate tracking accuracy > 95%
- Unsubscribe rate < 0.5%
- Zero spam complaints

---

## Alternative Paths Explored

### Alternative 1: Use AWS SES
**Why considered:** Cheap (₹8.30 per 1000 emails)  
**Why rejected:** Still external cost, less control, harder to debug issues

### Alternative 2: Use Resend.com
**Why considered:** Developer-friendly API  
**Why rejected:** Still paid service, newer/less proven than SendGrid

### Alternative 3: Zapier/Make Email Integration
**Why considered:** No-code integration  
**Why rejected:** Not a programmatic solution, doesn't meet product needs

### Alternative 4: No Email Integration
**Why considered:** Simplest option  
**Why rejected:** Email is critical for CRM, Marketing, and Finance modules

---

## Implementation Phases

### Phase 1: Connect & Send (Weeks 1-3)
- Complete Gmail/Outlook OAuth
- Build email send API
- CRM/Finance integration
- Timeline logging
- Basic UI

### Phase 2: Self-Host (Weeks 4-7)
- Deploy mailcow
- Configure DNS
- Build admin UI
- Monitoring setup
- Bounce processing

### Phase 3: Campaigns (Weeks 8-12)
- Campaign engine
- Open/click tracking
- Analytics dashboard
- Unsubscribe management
- A/B testing

### Phase 4: Advanced (Weeks 13-20)
- Generic IMAP/SMTP
- Shared inboxes
- Email automation
- Template builder
- (Optional) Full mailbox

---

## Dependencies

### External Dependencies
- Google OAuth (Gmail connection)
- Microsoft OAuth (Outlook connection)
- DNS provider (SPF/DKIM/DMARC records)
- VPS provider (mail server hosting)
- Object storage (S3/R2 for attachments)

### Internal Dependencies
- Prisma (database ORM)
- Bull (job queue)
- Redis (queue storage)
- PostgreSQL (database)
- Next.js (API routes)
- React (UI components)

### Team Dependencies
- Engineering (implementation)
- Product (requirements, UX)
- DevOps (infrastructure, monitoring)
- Support (documentation, training)
- Legal (compliance review)

---

## Stakeholder Sign-Off

### Product Team: ✅ Approved
**Reason:** Meets product vision, fast time to market, focused scope

### Engineering Team: ✅ Approved
**Reason:** Reasonable complexity, uses proven technologies, clear implementation path

### DevOps Team: ✅ Approved (with conditions)
**Conditions:** 
- Monitoring must be comprehensive
- Alerting must be proactive
- Backup strategy required
- Incident response plan needed

### Finance Team: ✅ Approved
**Reason:** Cost-effective, avoids recurring SaaS fees, good ROI

---

## Review & Iteration

### Review Schedule
- **Week 4:** Review Phase 1 completion
- **Week 8:** Review Phase 2 completion
- **Week 12:** Review Phase 3 completion
- **Month 6:** Architecture review, lessons learned

### Metrics to Track
- Email send volume (per tenant)
- Bounce rates (per domain)
- Open/click rates (per campaign)
- Infrastructure costs (per month)
- Support tickets (email-related)
- User satisfaction (NPS)

### Decision Review Criteria
- If bounce rate > 5% for 2 weeks → Review sending practices
- If costs exceed ₹6,200/month → Review infrastructure sizing
- If support tickets > 10/week → Review UX/documentation
- If user adoption < 70% → Review onboarding flow

---

## Conclusion

**Decision:** Build a **hybrid email architecture** that connects external inboxes (Gmail/Outlook/IMAP) for personal mail and self-hosts outbound infrastructure (mailcow) for PayAid-owned sending.

**Rationale:** This approach balances speed, cost, control, and operational burden. It leverages existing user infrastructure (Gmail/Outlook) while providing PayAid with full control over business-critical sending (campaigns, invoices, proposals).

**Next Steps:**
1. Begin Phase 1 implementation (Weeks 1-3)
2. Deploy mailcow infrastructure (Week 4)
3. Launch Phase 2 (Weeks 4-7)
4. Monitor metrics and iterate

**Status:** ✅ **APPROVED FOR IMPLEMENTATION**

**Sign-Off Date:** April 23, 2026

---

End of Architecture Decision Record.
