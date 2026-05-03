# Tenant ID Personalization

**Date:** January 2026  
**Status:** ✅ **IMPLEMENTED**

---

## 🎯 Feature: Personalized Tenant IDs

**Requirement:** Include the first part of the business name in tenant IDs for personalization.

**Example:**
- Business Name: "Demo Business Pvt Ltd"
- Tenant ID: `demo-a3b2c1` (first word + random alphanumeric suffix)

---

## ✅ Implementation

### Format
- **Pattern:** `[first-word][random-suffix]`
- **First Word:** Extracted from business name, lowercase, alphanumeric only
- **Random Suffix:** 6 alphanumeric characters (lowercase letters and numbers)
- **Total Length:** 5-30 characters

### Examples

| Business Name | Tenant ID Example |
|--------------|------------------|
| "Demo Business Pvt Ltd" | `demo-a3b2c1` |
| "Acme Corporation" | `acme-x9y8z7` |
| "Tech Solutions India" | `tech-m4n5p6` |
| "ABC Industries" | `abc-k7l8m9` |

---

## 🔧 Technical Details

### File: `lib/utils/tenant-id.ts`

**Function:** `generateTenantId(businessName: string, existingIds: string[] = [])`

**Logic:**
1. Extract first word from business name
2. Convert to lowercase
3. Remove special characters (keep only alphanumeric)
4. Limit to 20 characters max
5. Generate 6-character random suffix (base36: 0-9, a-z)
6. Combine: `firstword + suffix`
7. Check for duplicates and regenerate if needed
8. If still duplicate, use longer suffix (8 characters)

**Uniqueness:**
- Checks against existing tenant IDs
- Retries up to 10 times with new random suffixes
- If still duplicate, uses longer suffix (8 chars) and shorter word

**Validation:**
- Format: `^[a-z0-9]{5,30}$`
- Lowercase alphanumeric only
- No hyphens or special characters
- Length: 5-30 characters

---

## 📋 Usage

### Registration Flow

**File:** `app/api/auth/register/route.ts`

```typescript
// Generate personalized tenant ID from business name
const existingTenants = await prisma.tenant.findMany({
  select: { id: true },
})
const existingIds = existingTenants.map(t => t.id)

let personalizedTenantId = generateTenantId(validated.tenantName, existingIds)
let attempts = 0
while (existingIds.includes(personalizedTenantId) && attempts < 5) {
  personalizedTenantId = generateTenantId(validated.tenantName, existingIds)
  attempts++
}

// Create tenant with personalized ID
const tenant = await tx.tenant.create({
  data: {
    id: personalizedTenantId, // e.g., "demo-a3b2c1"
    name: validated.tenantName,
    // ... other fields
  },
})
```

---

## 🎨 Benefits

1. **Personalization** ✅
   - Tenant IDs are recognizable and meaningful
   - Users can identify their tenant ID easily

2. **Readability** ✅
   - Shorter, cleaner format
   - No hyphens (simpler format)

3. **Uniqueness** ✅
   - Random suffix ensures uniqueness
   - Collision detection and retry logic

4. **Consistency** ✅
   - All new tenants get personalized IDs
   - Format is consistent across the platform

---

## 🔄 Migration Notes

**Existing Tenants:**
- Existing tenant IDs remain unchanged (UUIDs or CUIDs)
- Only new registrations use personalized format

**Backward Compatibility:**
- Validation function updated to accept both formats
- Old format (with hyphens) still works
- New format (no hyphens) is preferred

---

**Status:** ✅ Personalized Tenant IDs Implemented!

