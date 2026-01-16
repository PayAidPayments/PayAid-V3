# Fix: Client-Side Prisma Import Error

**Date:** January 2026  
**Status:** ✅ **FIXED**

---

## 🐛 Problem

**Error:** `DATABASE_URL environment variable is not set` in client-side code

**Root Cause:**
- `lib/ai-helpers/lead-scoring.ts` imports Prisma (server-only)
- `components/LeadScoringBadge.tsx` is a client component (`'use client'`)
- When Next.js bundles client code, it tries to include `lead-scoring.ts`, which imports Prisma
- Prisma tries to access `DATABASE_URL` on the client side, causing the error

**Error Stack:**
```
lib/db/prisma.ts → lib/ai-helpers/lead-scoring.ts → components/LeadScoringBadge.tsx → app/dashboard/contacts/page.tsx
```

---

## ✅ Solution

### 1. Created Client-Safe Utility ✅
**File:** `lib/ai-helpers/lead-scoring-client.ts`

- Extracted `getScoreCategory()` function (pure function, no Prisma needed)
- Safe to import in client components
- No database dependencies

### 2. Updated Client Component ✅
**File:** `components/LeadScoringBadge.tsx`

**Before:**
```typescript
import { getScoreCategory } from '@/lib/ai-helpers/lead-scoring' // ❌ Imports Prisma
```

**After:**
```typescript
import { getScoreCategory } from '@/lib/ai-helpers/lead-scoring-client' // ✅ Client-safe
```

### 3. Added Prisma Guard ✅
**File:** `lib/db/prisma.ts`

Added guard to prevent Prisma from being imported in client code:
```typescript
// Prevent Prisma from being imported in client-side code
if (typeof window !== 'undefined') {
  throw new Error(
    'Prisma Client cannot be used in client-side code. ' +
    'It should only be imported in server-side code (API routes, server components, server actions).'
  )
}
```

---

## 📋 Files Changed

### New Files:
1. `lib/ai-helpers/lead-scoring-client.ts` - Client-safe lead scoring utilities

### Modified Files:
1. `components/LeadScoringBadge.tsx` - Updated import to use client-safe utility
2. `lib/db/prisma.ts` - Added client-side guard

---

## 🧪 Verification

### ✅ Server-Side Imports (Still Work):
- `app/api/leads/score/route.ts` ✅
- `app/api/leads/[id]/update-score/route.ts` ✅
- `lib/background-jobs/recalculate-lead-scores.ts` ✅
- `scripts/test-lead-scoring.ts` ✅

### ✅ Client-Side Imports (Now Safe):
- `components/LeadScoringBadge.tsx` ✅
- `app/dashboard/contacts/page.tsx` ✅
- `app/dashboard/contacts/[id]/page.tsx` ✅

---

## 🎯 Result

**Before:**
- ❌ Error: `DATABASE_URL environment variable is not set` in browser console
- ❌ Prisma being bundled in client code
- ❌ Client components trying to access server-only code

**After:**
- ✅ No client-side Prisma imports
- ✅ Client components use client-safe utilities
- ✅ Server-side code still uses full Prisma functionality
- ✅ Clear separation between client and server code

---

## 📝 Best Practices Applied

1. **Separate Client/Server Code**: Created dedicated client-safe utility file
2. **Guard Against Misuse**: Added runtime check to prevent Prisma in client code
3. **Pure Functions**: Extracted pure functions that don't need database access
4. **Clear Imports**: Updated imports to use appropriate files for context

---

**Status:** ✅ Error Fixed - Client-side Prisma import resolved!

