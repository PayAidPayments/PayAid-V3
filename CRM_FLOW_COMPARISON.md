# CRM Flow: Current vs Proposed

## Current Flow (Complex)

```
┌─────────┐
│  Lead   │ (Contact with type="lead")
└────┬────┘
     │
     │ User must manually convert
     ▼
┌─────────┐
│ Contact │ (Contact with type="contact")
└────┬────┘
     │
     │ User must manually create
     ▼
┌─────────┐
│  Deal   │ (Requires contactId)
└─────────┘
```

**Problems:**
- ❌ 3 separate steps
- ❌ User must remember conversion process
- ❌ Can't create Deal without Contact
- ❌ Confusing: "Lead" and "Contact" are same model

---

## Proposed Flow (Simple)

```
┌──────────┐
│ Prospect │ (Contact with stage="prospect")
└────┬─────┘
     │
     │ Auto-promote on first activity
     ▼
┌──────────┐
│ Contact  │ (Contact with stage="contact")
└────┬─────┘
     │
     │ Auto-promote on Deal won
     ▼
┌──────────┐
│ Customer │ (Contact with stage="customer")
└──────────┘

     OR

┌──────────┐
│  Deal    │ (Can be created directly)
└────┬─────┘
     │
     │ Auto-creates Contact if needed
     ▼
┌──────────┐
│ Contact  │ (Auto-created, stage="prospect")
└──────────┘
```

**Benefits:**
- ✅ 1-2 steps maximum
- ✅ System handles complexity
- ✅ Can create Deal first
- ✅ Clear progression: Prospect → Contact → Customer

---

## Terminology Comparison

| Current Term | Proposed Term | Meaning |
|-------------|---------------|---------|
| Lead | Prospect | Initial discovery, minimal engagement |
| Contact (type="lead") | Prospect | Same as above |
| Contact (type="contact") | Contact | Active engagement |
| Contact (type="customer") | Customer | Has purchased |
| Convert Lead | Promote to Contact | One-click action |
| Create Contact then Deal | Create Deal (auto-creates Contact) | Simplified workflow |

---

## User Actions Comparison

### Current: Creating a Deal
```
1. User creates Lead (Contact with type="lead")
2. User converts Lead to Contact
3. User creates Deal and links to Contact
Total: 3 steps, 3 pages
```

### Proposed: Creating a Deal
```
1. User clicks "Create Deal"
2. User enters: Name, Email, Deal Value
3. System auto-creates Contact if needed
Total: 1 step, 1 page
```

---

## Data Model Changes

### Current Schema
```prisma
model Contact {
  type    String @default("lead")  // lead, contact, customer
  status  String @default("active")
  // ...
}

model Deal {
  contactId String  // Required
  contact   Contact @relation(...)
  // ...
}
```

### Proposed Schema
```prisma
model Contact {
  type    String @default("lead")     // Keep for backward compat
  stage   String @default("prospect") // NEW: prospect, contact, customer
  status  String @default("active")   // active, inactive
  // ...
}

model Deal {
  contactId String?  // Make optional
  contact   Contact? @relation(...)  // Optional relation
  // Add fields for direct creation:
  contactName  String?  // If creating without Contact
  contactEmail String?  // If creating without Contact
  contactPhone String?  // If creating without Contact
  // ...
}
```

---

## UI Changes

### Current Navigation
```
CRM
├── Leads (shows Contacts with type="lead")
├── Contacts (shows Contacts with type="contact")
└── Deals (requires Contact first)
```

### Proposed Navigation
```
CRM
├── Prospects (shows Contacts with stage="prospect")
├── Contacts (shows Contacts with stage="contact")
├── Customers (shows Contacts with stage="customer")
├── Deals (can create directly)
└── All People (unified view with stage filter)
```

### Current Deal Creation
```
1. Go to Contacts page
2. Find or create Contact
3. Go to Deals page
4. Click "Create Deal"
5. Select Contact from dropdown
6. Fill Deal details
```

### Proposed Deal Creation
```
1. Click "Create Deal" (anywhere)
2. Enter: Name, Email, Deal Value, Close Date
3. System checks: Contact exists?
   - YES → Link automatically
   - NO → Create Contact and link
4. Done!
```

---

## Example Scenarios

### Scenario 1: Website Form Submission

**Current:**
```
1. Form creates Contact (type="lead")
2. Sales rep sees in "Leads" page
3. Sales rep converts to Contact
4. Sales rep creates Deal
5. Links Deal to Contact
```

**Proposed:**
```
1. Form creates Contact (stage="prospect")
2. Sales rep sees in "Prospects" page
3. Sales rep calls → Auto-promotes to "contact"
4. Sales rep creates Deal → Auto-links to Contact
```

### Scenario 2: Trade Show Meeting

**Current:**
```
1. Sales rep creates Lead manually
2. Later converts to Contact
3. Creates Deal
4. Links everything
```

**Proposed:**
```
1. Sales rep creates Deal directly with name/email
2. System auto-creates Contact (stage="prospect")
3. Deal is linked automatically
4. Later, when engaging, promote Contact to "contact"
```

### Scenario 3: Existing Customer, New Deal

**Current:**
```
1. Find existing Contact (type="customer")
2. Create new Deal
3. Link to Contact
```

**Proposed:**
```
1. Create Deal
2. Search for Contact by name/email
3. Link to existing Contact
4. (Contact already stage="customer")
```

---

## Migration Strategy

### Phase 1: Add New Fields (Non-Breaking)
```sql
ALTER TABLE "Contact" ADD COLUMN "stage" TEXT DEFAULT 'prospect';
UPDATE "Contact" SET "stage" = 
  CASE 
    WHEN "type" = 'lead' THEN 'prospect'
    WHEN "type" = 'contact' THEN 'contact'
    WHEN "type" = 'customer' THEN 'customer'
    ELSE 'prospect'
  END;
```

### Phase 2: Make Deal.contactId Optional
```sql
ALTER TABLE "Deal" ALTER COLUMN "contactId" DROP NOT NULL;
ALTER TABLE "Deal" ADD COLUMN "contactName" TEXT;
ALTER TABLE "Deal" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "Deal" ADD COLUMN "contactPhone" TEXT;
```

### Phase 3: Update UI
- Replace "Leads" with "Prospects" (filter by stage)
- Update Deal creation form
- Add stage promotion buttons
- Add auto-creation logic

### Phase 4: Deprecate Old Fields
- Keep `type` field for backward compat
- Show warning in UI to use `stage`
- Plan removal in future version

---

## Benefits Summary

### For End Users
- ✅ **50% fewer clicks** to create a Deal
- ✅ **Clearer mental model** - one person, one record
- ✅ **Less training needed** - intuitive flow
- ✅ **Faster data entry** - smart forms

### For Employees
- ✅ **Easier onboarding** - simpler concepts
- ✅ **Fewer mistakes** - system handles complexity
- ✅ **Better adoption** - less resistance to using CRM

### For Business
- ✅ **Better data quality** - less duplication
- ✅ **Clearer reporting** - stage-based analytics
- ✅ **Higher productivity** - faster workflows

---

## Implementation Priority

### High Priority (Must Have)
1. ✅ Add `stage` field to Contact
2. ✅ Make Deal.contactId optional
3. ✅ Update Deal creation form
4. ✅ Add auto-creation logic

### Medium Priority (Should Have)
5. ⚠️ Replace "Leads" page with "Prospects"
6. ⚠️ Add stage promotion buttons
7. ⚠️ Auto-promote on activities
8. ⚠️ Update navigation

### Low Priority (Nice to Have)
9. ⚪ Unified "All People" view
10. ⚪ Stage-based notifications
11. ⚪ Advanced stage analytics
12. ⚪ Stage transition history

---

## Questions & Answers

**Q: Will this break existing integrations?**
A: No, we'll keep `type` field for backward compatibility. New integrations should use `stage`.

**Q: What about custom fields?**
A: Custom fields work the same way, attached to Contact model.

**Q: Can we still filter by "type"?**
A: Yes, during migration period. Eventually we'll deprecate it.

**Q: What if a Contact has multiple Deals?**
A: Perfect! One Contact can have many Deals (upsell, renewal, etc.)

**Q: How do we handle companies vs individuals?**
A: Contact model handles both. For complex B2B, we can add Account model later.

---

## Next Steps

1. **Review proposal** with team
2. **Get user feedback** on simplified flow
3. **Create technical spec** for implementation
4. **Build prototype** of new Deal creation
5. **Test with beta users**
6. **Roll out gradually** with feature flag

