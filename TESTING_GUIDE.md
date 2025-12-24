# PayAid V3 - Testing Guide
## Quick Reference for Testing New Features

**Date:** December 19, 2025

---

## 🧪 Testing Checklist

### 1. Lead Scoring System

#### Test Lead Scoring
1. **Visit Contacts Page:**
   - Go to `/dashboard/contacts`
   - Filter by "Lead" type
   - Verify "Recalculate Scores" button appears

2. **Recalculate Scores:**
   - Click "Recalculate Scores" button
   - Wait for completion message
   - Verify scores appear in the "Lead Score" column

3. **Test Score Filtering:**
   - Select "🔥 Hot (70+)" filter
   - Verify only high-scoring leads shown
   - Test "⚠️ Warm (40-69)" and "❄️ Cold (0-39)" filters

4. **Verify Score Display:**
   - Check color coding:
     - 🔥 Green badge for 70+
     - ⚠️ Yellow badge for 40-69
     - ❄️ Gray badge for 0-39
   - Verify scores are sorted (highest first)

#### Test via API
```bash
# Score all leads
curl -X POST http://localhost:3000/api/leads/score \
  -H "Content-Type: application/json" \
  -d '{"batch": true}'

# Get score for specific lead
curl http://localhost:3000/api/leads/score?contactId=CONTACT_ID
```

#### Test via Script
```bash
npx tsx scripts/test-lead-scoring.ts
```

---

### 2. Smart Lead Allocation

#### Test Lead Allocation
1. **Create Sales Rep:**
   - Go to `/dashboard/settings/sales-reps`
   - Add a sales rep (or use API)
   - Set specialization (e.g., "Tech")
   - Set conversion rate

2. **Test Auto-Allocation:**
   - Go to a lead detail page (`/dashboard/contacts/[id]`)
   - Click "Assign Lead" button
   - Click "🤖 Auto-Assign Best Match"
   - Verify lead is assigned to best rep
   - Check notification (if email/SMS configured)

3. **Test Manual Allocation:**
   - Click "Assign Lead" again
   - Review top 3 suggestions
   - Verify reasons shown (workload, specialization, performance)
   - Select a different rep and assign
   - Verify assignment updated

4. **Test Leave Status:**
   - Go to Sales Reps page
   - Click "Set Leave" for a rep
   - Try auto-allocating a lead
   - Verify rep on leave is excluded
   - Return rep from leave
   - Verify rep is now available

#### Test via API
```bash
# Get allocation suggestions
curl http://localhost:3000/api/leads/LEAD_ID/allocation-suggestions

# Auto-allocate
curl -X POST http://localhost:3000/api/leads/LEAD_ID/allocate \
  -H "Content-Type: application/json" \
  -d '{"autoAssign": true}'

# Set rep on leave
curl -X PUT http://localhost:3000/api/sales-reps/REP_ID/set-leave \
  -H "Content-Type: application/json" \
  -d '{"isOnLeave": true, "leaveEndDate": "2025-12-25T00:00:00Z"}'
```

#### Test via Script
```bash
npx tsx scripts/test-lead-allocation.ts
```

---

### 3. Lead Nurturing Sequences

#### Test Nurture Sequences
1. **Seed Default Templates (First Time):**
   ```bash
   npx tsx prisma/seed-nurture-templates.ts
   ```

2. **Enroll Lead in Sequence:**
   - Go to a lead detail page
   - Click "📧 Nurture Sequence" button
   - Select a template (Cold Lead or Warm Lead)
   - Click "Apply"
   - Verify enrollment success message

3. **View Active Sequences:**
   - On lead detail page, scroll to "Active Nurture Sequences"
   - Verify sequence shows:
     - Template name
     - Progress (X/Y emails, percentage)
     - Status (ACTIVE, PAUSED, COMPLETED)
     - Progress bar

4. **Test Sequence Management:**
   - Pause a sequence (via API for now)
   - Resume a sequence
   - Stop/cancel a sequence

5. **Test Email Sending (Cron):**
   ```bash
   # Manually trigger email sending
   curl -X POST http://localhost:3000/api/cron/send-scheduled-emails \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     -H "Content-Type: application/json"
   ```

#### Test via API
```bash
# List templates
curl http://localhost:3000/api/nurture/templates

# Enroll lead
curl -X POST http://localhost:3000/api/leads/LEAD_ID/enroll-sequence \
  -H "Content-Type: application/json" \
  -d '{"templateId": "TEMPLATE_ID"}'

# Get active sequences
curl http://localhost:3000/api/leads/LEAD_ID/sequences

# Pause sequence
curl -X PUT http://localhost:3000/api/sequences/ENROLLMENT_ID/pause \
  -H "Content-Type: application/json" \
  -d '{"action": "pause"}'
```

---

### 4. Sales Rep Management

#### Test Sales Rep Features
1. **View Sales Reps:**
   - Go to `/dashboard/settings/sales-reps`
   - Verify list shows all reps
   - Check columns: Name, Email, Specialization, Conversion Rate, Assigned Leads, Deals

2. **Create Sales Rep:**
   - Click "Add Sales Rep"
   - Select a user (or create via API)
   - Set specialization
   - Save

3. **Set Leave Status:**
   - Click "Set Leave" for a rep
   - Check "On Leave" checkbox
   - Optionally set leave end date
   - Save
   - Verify status changes to "On Leave"

#### Test via API
```bash
# List sales reps
curl http://localhost:3000/api/sales-reps

# Create sales rep
curl -X POST http://localhost:3000/api/sales-reps \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "specialization": "Tech"}'

# Get sales rep details
curl http://localhost:3000/api/sales-reps/REP_ID
```

---

## 🔍 Verification Steps

### Database Verification
```sql
-- Check lead scores
SELECT id, name, leadScore, scoreUpdatedAt 
FROM "Contact" 
WHERE type = 'lead' 
ORDER BY leadScore DESC 
LIMIT 10;

-- Check sales reps
SELECT sr.id, u.name, sr.specialization, sr.conversionRate, sr."isOnLeave"
FROM "SalesRep" sr
JOIN "User" u ON sr."userId" = u.id;

-- Check nurture enrollments
SELECT ne.id, c.name, nt.name as template, ne.status, ne."completedSteps", ne."totalSteps"
FROM "NurtureEnrollment" ne
JOIN "Contact" c ON ne."contactId" = c.id
JOIN "NurtureTemplate" nt ON ne."templateId" = nt.id;

-- Check scheduled emails
SELECT se.id, c.name, se.subject, se.status, se."scheduledAt", se."sentAt"
FROM "ScheduledEmail" se
JOIN "Contact" c ON se."contactId" = c.id
WHERE se.status = 'PENDING'
ORDER BY se."scheduledAt" ASC;
```

---

## 🐛 Common Issues & Solutions

### Issue: Lead scores not showing
**Solution:**
1. Click "Recalculate Scores" button
2. Check database: `SELECT leadScore FROM "Contact" WHERE id = 'CONTACT_ID'`
3. Verify API: `GET /api/leads/score?contactId=CONTACT_ID`

### Issue: No sales reps available for allocation
**Solution:**
1. Create sales reps at `/dashboard/settings/sales-reps`
2. Verify reps are not on leave
3. Check API: `GET /api/sales-reps`

### Issue: Emails not sending
**Solution:**
1. Check cron job is running: `GET /api/cron/send-scheduled-emails`
2. Verify SendGrid API key is set (if using email service)
3. Check scheduled emails: `SELECT * FROM "ScheduledEmail" WHERE status = 'PENDING'`
4. Verify `scheduledAt` is in the past

### Issue: Nurture sequences not enrolling
**Solution:**
1. Seed templates: `npx tsx prisma/seed-nurture-templates.ts`
2. Verify template exists: `GET /api/nurture/templates`
3. Check contact is a lead: `type = 'lead'`
4. Verify not already enrolled

---

## 📊 Expected Results

### Lead Scoring
- **Cold Lead (0 interactions):** Score 10-20
- **Warm Lead (5 interactions):** Score 40-70
- **Hot Lead (10+ interactions + deals):** Score 70-100

### Lead Allocation
- **Best Match:** Rep with:
  - Fewest assigned leads
  - Matching specialization
  - Highest conversion rate
  - Not on leave

### Nurture Sequences
- **Cold Lead Template:** 5 emails over 10 days
- **Warm Lead Template:** 3 emails over 5 days
- **Emails Scheduled:** Based on enrollment date + dayNumber

---

## ✅ Testing Complete When

- [ ] All leads have scores displayed
- [ ] Scores update when clicking "Recalculate"
- [ ] Filtering by score works correctly
- [ ] Leads can be assigned to sales reps
- [ ] Auto-allocation chooses best rep
- [ ] Leave status excludes reps from allocation
- [ ] Leads can be enrolled in nurture sequences
- [ ] Active sequences show on contact page
- [ ] Scheduled emails are created on enrollment
- [ ] Cron jobs are running (check logs)

---

**Last Updated:** December 19, 2025
