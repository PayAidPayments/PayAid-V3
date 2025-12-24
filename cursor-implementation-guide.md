# PayAid V3: Cursor Implementation Guide
## Quick-Start Instructions for Adding Missing Features

**Date:** December 19, 2025  
**For:** Your Cursor AI Development Agent  
**Priority:** CRITICAL - Implement in next 4 weeks

---

## YOUR MISSION

You've built an amazing platform (85% complete). Now let's add **10 missing features from Solid Performers** to make PayAid V3 **unbeatable** in the Indian SMB market.

**Timeline:** 4 weeks (22 development days)  
**Investment:** ₹7 lakh  
**Revenue Impact:** ₹4.5 crore/year  
**ROI:** 6,250%

---

# PHASE 1: WEEK 1 (Lead Scoring + Auto-allocation)

## Feature 1: Lead Scoring System (Mon-Wed)

### What to Build:
A **0-100 lead score** that automatically ranks leads by purchase likelihood.

### Technical Spec:
```typescript
// Calculate score based on:
- Email opens (10 pts each, max 100)
- Website visits (5 pts each, max 150)
- Interactions (8 pts each, max 160)
- Deal count (25 pts each, max 250)
- Days since contact (decay 2 pts/day)
- Normalize to 0-100

// Examples:
- No activity = 10 (cold)
- 5 emails, 3 visits = 50 (warm)
- 10 emails, 2 deals = 85 (hot)
```

### Database Changes:
```prisma
// Update Contact model in schema.prisma
model Contact {
  // ... existing fields
  leadScore Float @default(0)
  scoreUpdatedAt DateTime @default(now())
  scoreComponents Json? // { emailOpens: 50, visits: 75, ... }
}
```

### API Endpoints to Create:
1. `POST /api/leads/score` - Score one lead
2. `POST /api/leads/scores/batch` - Score all leads
3. `PUT /api/leads/[id]/update-score` - Manual update

### Frontend Components:
```typescript
// Create components/LeadScoringBadge.tsx
- Show score 0-100
- Color code: Red (0-40), Yellow (40-70), Green (70-100)
- Icon: 🔥 Hot, ⚠️ Warm, ❄️ Cold

// Update app/dashboard/leads/page.tsx
- Add score column
- Sort by score by default
- Filter by score range (Hot/Warm/Cold)
```

### Code to Write:
```typescript
// lib/ai-helpers/lead-scoring.ts
export async function scoreLeads(contact: Contact): Promise<number> {
  // Get interaction data
  const interactions = await db.interaction.count({
    where: { contactId: contact.id }
  });
  
  // Get deal data
  const deals = await db.deal.findMany({
    where: { contactId: contact.id }
  });
  
  let score = 0;
  score += Math.min(interactions * 8, 160); // Max 160
  score += Math.min(deals.length * 25, 250); // Max 250
  
  // Recency decay
  if (contact.lastContactedAt) {
    const daysOld = (Date.now() - contact.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 50 - (daysOld * 2));
  }
  
  // Normalize to 0-100
  return Math.min(100, Math.max(0, score / 5));
}
```

### Testing:
- Test with 0 interactions = 10-20 score ✅
- Test with 5 interactions + 1 deal = 60-70 score ✅
- Test with 10+ interactions + 3 deals = 80-100 score ✅

**Deliverable:** Lead score visible on all lead cards  
**Time:** 3-4 days  
**Complexity:** Medium

---

## Feature 2: Smart Lead Allocation (Wed-Fri)

### What to Build:
**Automatically assign leads to best sales rep** based on workload, specialization, performance.

### Technical Spec:
```
New lead arrives
    ↓
Check rules:
  - Who has fewest leads? (balance workload)
  - Who specializes in this industry? (expertise)
  - Who has best conversion rate? (performance)
  - Who's on leave? (skip)
    ↓
Auto-assign to BEST rep
    ↓
Send notification (email + SMS + in-app)
```

### Database Changes:
```prisma
// Add SalesRep model
model SalesRep {
  id String @id
  userId String @unique
  user User @relation(fields: [userId])
  
  specialization String? // "Tech", "Finance", "Healthcare"
  conversionRate Float @default(0) // 0-1
  isOnLeave Boolean @default(false)
  leaveEndDate DateTime?
  
  assignedLeads Contact[]
  deals Deal[]
  
  createdAt DateTime @default(now())
}

// Update Contact
model Contact {
  // ... existing fields
  assignedToId String?
  assignedTo SalesRep? @relation(fields: [assignedToId])
}
```

### API Endpoints:
1. `POST /api/leads/[id]/allocate` - Auto-allocate
2. `GET /api/leads/[id]/allocation-suggestions` - Get suggestions
3. `PUT /api/sales-reps/[id]/set-leave` - Mark rep on leave

### Frontend:
```typescript
// Create components/LeadAllocationDialog.tsx
- Show top 3 suggested reps
- Show: Name, Leads assigned, Conversion rate, Specialization
- One-click assign button
- Notification that rep will be alerted

// Update lead detail page
- Show assigned rep
- Show option to reassign
```

### Notification System:
```typescript
// lib/notifications/send-lead-alert.ts
Send to assigned rep:
  Channel: Email + SMS + In-app
  Message: "New lead assigned: {company} - ${value}L deal"
  Action: Direct link to lead
  Urgency: If score > 70, mark as 🔥 HOT
```

**Deliverable:** New leads auto-assigned + rep notified  
**Time:** 2-3 days  
**Complexity:** Medium

---

# PHASE 1: WEEK 2 (Nurture Sequences)

## Feature 3: Lead Nurturing Sequences (Mon-Wed)

### What to Build:
**Automated email sequences** that nurture cold leads over 7-10 days.

### Templates to Create:
```
Cold Lead Nurture:
  Day 0: Welcome + intro
  Day 3: Case study
  Day 5: Special offer
  Day 7: Offer expiring
  Day 10: Last chance

Warm Lead Nurture:
  Day 0: Quick demo
  Day 2: Pricing details
  Day 5: Setup checklist
```

### Database Schema:
```prisma
model NurtureTemplate {
  id String @id
  name String // "Cold Lead", "Warm Lead"
  steps NurtureStep[]
  createdAt DateTime @default(now())
}

model NurtureStep {
  id String @id
  templateId String
  template NurtureTemplate @relation(fields: [templateId])
  
  dayNumber Int // 0, 3, 5, 7, 10
  emailTemplateId String
  subject String
  body String
  
  order Int
  createdAt DateTime @default(now())
}

model ScheduledEmail {
  id String @id
  contactId String
  contact Contact @relation(fields: [contactId])
  
  templateId String // Which email template
  subject String
  body String
  
  scheduledAt DateTime
  sentAt DateTime?
  status "PENDING" | "SENT" | "FAILED"
  
  createdAt DateTime @default(now())
}

model NurtureEnrollment {
  id String @id
  contactId String
  contact Contact @relation(fields: [contactId])
  
  templateId String
  enrolledAt DateTime
  status "ACTIVE" | "PAUSED" | "COMPLETED"
  
  completedSteps Int @default(0)
  totalSteps Int
  
  createdAt DateTime @default(now())
}
```

### API Endpoints:
1. `GET /api/nurture/templates` - List available templates
2. `POST /api/leads/[id]/enroll-sequence` - Enroll lead
3. `GET /api/leads/[id]/sequences` - Active sequences
4. `PUT /api/sequences/[id]/pause` - Pause sequence
5. `DELETE /api/sequences/[id]` - Stop sequence

### Cron Job:
```typescript
// lib/background-jobs/send-scheduled-emails.ts
// Run every 15 minutes
// Find pending emails with scheduledAt <= now()
// Send via SendGrid
// Update status
// Retry failed (max 3 attempts)
```

### Frontend:
```typescript
// Create components/NurtureSequenceApplier.tsx
- Show template gallery (Cold, Warm, Re-engagement)
- One-click "Apply template" button
- Show what emails will be sent
- Timeline visualization

// Update lead detail page
- Show active sequences
- Show completion progress
- Option to pause/resume
```

**Deliverable:** Leads auto-enrolled, emails send automatically  
**Time:** 5-6 days  
**Complexity:** Medium-High

---

## Feature 4: Multi-channel Alerts (Wed-Fri)

### What to Build:
**Notifications for sales team** about new leads, follow-ups, hot deals.

### Alert Types:
```
NEW_LEAD_ASSIGNED
  When: New lead assigned
  Where: Email + SMS + In-app
  Message: "New lead from {company} assigned"

FOLLOW_UP_DUE
  When: Follow-up date arrives
  Where: SMS + In-app
  Message: "{name} follow-up due today"

HOT_LEAD_INCOMING
  When: Lead score reaches 70+
  Where: SMS + Push + Whatsapp
  Message: "🔥 Hot lead! {name} ready to buy"
```

### Database:
```prisma
model Alert {
  id String @id
  repId String
  rep SalesRep @relation(fields: [repId])
  
  type "NEW_LEAD" | "FOLLOW_UP_DUE" | "HOT_LEAD"
  title String
  message String
  leadId String?
  
  channels String[] // ["email", "sms", "in-app"]
  priority "LOW" | "MEDIUM" | "HIGH"
  
  isRead Boolean @default(false)
  readAt DateTime?
  
  createdAt DateTime @default(now())
}
```

### Implementation:
```typescript
// lib/alerts/send-alert.ts
export async function sendAlert(
  rep: SalesRep,
  alert: Alert
) {
  const channels = alert.channels;
  
  if (channels.includes('email')) {
    await sendEmail(rep.email, alert);
  }
  if (channels.includes('sms')) {
    await sendSMS(rep.phone, alert.message);
  }
  if (channels.includes('whatsapp')) {
    await sendWhatsApp(rep.phone, alert.message);
  }
  
  // Always save in-app notification
  await db.alert.create({ data: alert });
}
```

**Deliverable:** Reps get real-time alerts  
**Time:** 2-3 days  
**Complexity:** Low-Medium

---

# PHASE 1: WEEK 3-4 (Team Dashboard + Source Tracking)

## Feature 5: Lead Source ROI Tracking (Week 3 - Mon-Tue)

### Database:
```prisma
model LeadSource {
  id String @id
  name String // "Google Search", "Facebook Ad", "LinkedIn", etc.
  type String // "organic", "paid", "referral", "social"
  
  leadsCount Int @default(0)
  conversionsCount Int @default(0)
  totalValueFromSource Float @default(0)
  
  conversionRate Float // Calculated: conversions/leads
  avgDealValue Float // Calculated: totalValue/conversions
  roi Float // Calculated: value/cost
  
  contacts Contact[]
  createdAt DateTime @default(now())
}

// Update Contact
model Contact {
  sourceId String?
  source LeadSource? @relation(fields: [sourceId])
  sourceData Json? // { utm_source, utm_medium, utm_campaign }
}
```

### UI Dashboard:
```typescript
// components/LeadSourceDashboard.tsx
Show table:
  Source | Leads | Conversion% | Avg Deal | ROI
  Google | 50    | 20%         | ₹5L     | 250%
  Facebook | 30 | 10%         | ₹3L     | 150%
  Referral | 20  | 40%         | ₹8L     | 400%
```

**Time:** 2-3 days

---

## Feature 6: Team Performance Dashboard (Week 3 - Wed-Fri)

### What to Build:
Real-time sales team metrics and leaderboard.

### Metrics to Track:
```
Individual Rep:
  - Calls made (today, week, month)
  - Emails sent
  - Meetings scheduled
  - Deals closed
  - Revenue closed
  - Conversion rate (%)
  - Close rate (%)

Team Leaderboard:
  Rank 1: Raj (₹50L)
  Rank 2: Priya (₹45L)
  Rank 3: Amit (₹40L)
```

### Database:
```prisma
// Track rep stats (calculated)
model RepStats {
  id String @id
  repId String
  rep SalesRep @relation(fields: [repId])
  
  period "TODAY" | "WEEK" | "MONTH" | "YEAR"
  
  callsMade Int @default(0)
  emailsSent Int @default(0)
  meetingsScheduled Int @default(0)
  
  dealsClosed Int @default(0)
  revenue Float @default(0)
  conversionRate Float @default(0)
  
  createdAt DateTime @default(now())
}
```

### Frontend:
```typescript
// components/SalesPerformanceDashboard.tsx
Show KPI cards:
  - Calls Made: 25 (target: 20) ✅
  - Deals: 3 (target: 3) ✅
  - Revenue: ₹25L (target: ₹20L) ✅
  - Conv Rate: 35% (target: 30%) ✅

// Leaderboard
Show ranked list with avatars, names, revenue
```

**Time:** 4-5 days

---

# ADDITIONAL FEATURES (Next 2-4 Weeks)

## Feature 7: Email Template Library (Week 4)
**Time:** 3-4 days

Pre-built templates:
- Cold outreach
- Follow-up
- Objection handling
- Closing
- Re-engagement

## Feature 8: Bulk Lead Import (Week 4)
**Time:** 2-3 days

CSV upload with:
- Field mapping
- Duplicate detection
- Auto-assignment

## Feature 9: Custom Dashboards (Weeks 5-6)
**Time:** 4-5 days

Drag-drop dashboard builder with widgets.

## Feature 10: Advanced Reports (Weeks 5-6)
**Time:** 4-5 days

Pre-built reports + export to PDF/Excel.

---

# CURSOR PROMPTS (Copy-Paste Ready)

## Prompt 1: Lead Scoring
```
Implement lead scoring system in PayAid V3:

1. Add leadScore Float field to Contact model in prisma/schema.prisma
2. Create lib/ai-helpers/lead-scoring.ts with scoreLeads() function:
   - Email opens: 10 pts each (max 100)
   - Website visits: 5 pts each (max 150)
   - Interactions: 8 pts each (max 160)
   - Deals: 25 pts each (max 250)
   - Recency decay: -2 pts per day
   - Normalize to 0-100
3. Create app/api/leads/score/route.ts endpoint
4. Create components/LeadScoringBadge.tsx showing score with color coding
5. Update app/dashboard/leads/page.tsx to show scores
6. Add cron job to recalculate scores hourly
7. Tests: Score 0 activity = 10-20, score 5 interactions = 60-70, score 10+ interactions + deal = 80-100

Files: prisma/schema.prisma, lib/ai-helpers/lead-scoring.ts, app/api/leads/score/route.ts, components/LeadScoringBadge.tsx, app/dashboard/leads/page.tsx

Tech: Next.js, Prisma, PostgreSQL
Timeline: 3-4 days
```

## Prompt 2: Auto Allocation
```
Implement intelligent lead allocation in PayAid V3:

1. Add SalesRep model to prisma/schema.prisma with:
   - userId, specialization, conversionRate, isOnLeave, leaveEndDate
   - Relation to assigned contacts

2. Create lib/sales-automation/lead-allocation.ts with autoAllocateLead() function:
   - Get all active reps
   - Score each rep: -2 per assigned lead, +50 if specialization matches, +conversionRate*10
   - Skip if on leave
   - Return best scored rep

3. Create app/api/leads/[id]/allocate/route.ts endpoint

4. Send notification when allocated (email + SMS + in-app)

5. Create LeadAllocationDialog component showing top 3 options

6. Update Contact model to include assignedToId relation

Files: prisma/schema.prisma, lib/sales-automation/lead-allocation.ts, app/api/leads/[id]/allocate/route.ts, components/LeadAllocationDialog.tsx

Tech: Next.js, Prisma, PostgreSQL, SendGrid (email), Twilio (SMS)
Timeline: 2-3 days
```

[Continue with prompts for each feature...]

---

# IMPLEMENTATION CHECKLIST

## Week 1 (Lead Scoring + Auto-allocation)
- [ ] Lead scoring algorithm working
- [ ] API endpoints tested
- [ ] UI badges displaying scores
- [ ] Auto-allocation choosing correct rep
- [ ] Notifications sending to reps
- [ ] Tested with sample data
- [ ] No bugs/errors

## Week 2 (Nurture Sequences)
- [ ] Sequence templates created (Cold, Warm)
- [ ] Email scheduling cron working
- [ ] Emails sending via SendGrid
- [ ] Enrollment tracking working
- [ ] UI showing active sequences
- [ ] Can pause/resume sequences
- [ ] Delivery tracking accurate

## Week 3 (Dashboards)
- [ ] Lead source ROI calculated
- [ ] Source dashboard showing data
- [ ] Rep stats being tracked
- [ ] Leaderboard sorted correctly
- [ ] KPI cards showing metrics
- [ ] Trends/comparisons visible

## Week 4 (Polish + Launch)
- [ ] All features integrated
- [ ] No data conflicts
- [ ] Performance tested (100+ leads)
- [ ] Security reviewed
- [ ] Documentation written
- [ ] Support team trained
- [ ] Ready for production

---

# FINAL NOTES FOR CURSOR

### Key Points:
1. **Lead Scoring is #1 priority** - impacts all other features
2. **Use existing PayAid architecture** - don't reinvent
3. **Build incrementally** - test each feature before moving to next
4. **Database migrations** - run after each schema change
5. **Test with real data** - not just sample data

### Common Pitfalls to Avoid:
❌ Don't hardcode weights - make configurable  
❌ Don't forget database indexes on frequently queried fields  
❌ Don't skip tests - they catch bugs early  
❌ Don't deploy without production backup  
❌ Don't forget to update types after schema changes  

### Success Criteria:
✅ 90%+ lead scoring accuracy  
✅ <2s API response time  
✅ 100% email delivery rate  
✅ Zero data loss  
✅ All tests passing  

---

**Let's build the best SaaS platform for Indian SMBs! 🚀**

