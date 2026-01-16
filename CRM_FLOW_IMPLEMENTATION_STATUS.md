# CRM Simplified Flow - Implementation Status

## Current Issues (As Reported)

1. **Navigation shows old terminology:**
   - "Leads" tab instead of "Prospects"
   - No clear "Customers" tab
   - Confusing separation between "Leads" and "Contacts"

2. **Forms use old classification:**
   - Contact creation form has `type` dropdown: "Lead", "Customer", "Vendor", "Employee"
   - Should use `stage` field: "Prospect", "Contact", "Customer"
   - No guidance on when to use what

3. **Deal creation requires Contact:**
   - Form requires selecting existing Contact first
   - API supports auto-creation but UI doesn't expose it
   - No option to create Deal with just name/email

4. **No user guidance:**
   - Employees don't know what to enter where
   - No tooltips explaining the flow
   - No visual indicators of stage progression

## Proposed Simplified Flow (From Documentation)

```
Prospect → Contact → Customer
         ↓
        Deal (can be created at any stage)
```

### Stage Definitions:
- **Prospect**: Just discovered, minimal info (website form, business card, referral)
- **Contact**: Actively engaging (first call, email sent, meeting scheduled)
- **Customer**: Has purchased (Deal won, invoice created, payment received)

### Deal Creation:
- Can be created directly with name/email
- System auto-creates Contact if one doesn't exist
- No need to create Contact first

## Implementation Plan

### Phase 1: Update Navigation ✅ IN PROGRESS
- [x] Replace "Leads" with "Prospects" in navigation
- [ ] Add "Customers" tab
- [ ] Update all layout files to use new terminology
- [ ] Keep "All People" as unified view

### Phase 2: Update Contact Forms
- [ ] Replace `type` dropdown with `stage` dropdown
- [ ] Add helpful descriptions for each stage
- [ ] Add tooltips explaining when to use each stage
- [ ] Update default to "prospect" for new contacts

### Phase 3: Update Deal Creation
- [ ] Allow creating Deal with name/email (no Contact required)
- [ ] Add "Create Contact" option if Contact doesn't exist
- [ ] Auto-link to existing Contact if found
- [ ] Show clear messaging about auto-creation

### Phase 4: Add User Guidance
- [ ] Add stage progression indicators
- [ ] Add tooltips on forms explaining the flow
- [ ] Add help text on key pages
- [ ] Create visual flow diagram

### Phase 5: Update All Pages
- [ ] Update Leads page to use "Prospects" terminology
- [ ] Update Contacts page to show stage-based filtering
- [ ] Update all references from `type` to `stage`
- [ ] Ensure backward compatibility with `type` field

## Current Data Model

### Schema (from Prisma):
```prisma
model Contact {
  type  String @default("lead")     // Deprecated: Use stage instead
  stage String @default("prospect") // NEW: prospect, contact, customer
  // ...
}
```

### Current Usage:
- `type` field: Still used in forms (needs update)
- `stage` field: Used in API and some pages (needs full adoption)
- Both exist for backward compatibility

## Next Steps

1. Update navigation labels in all CRM layouts
2. Update Contact creation/edit forms
3. Update Deal creation form
4. Add user guidance and tooltips
5. Test the complete flow
