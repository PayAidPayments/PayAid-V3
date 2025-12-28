# Remaining Files to Fix - Status Report

## Current Status

Based on the last build error and codebase analysis:

### Files with Prisma Schema Relation Issues: **6 files**
These files reference relations that don't exist in the Prisma schema:
- `app/api/hr/leave/requests/route.ts` - `approver` relation
- `app/api/hr/interviews/route.ts` - `interviewer` relation  
- `app/api/hr/interviews/[id]/route.ts` - `interviewer` relation
- `app/api/hr/candidates/[id]/route.ts` - `interviewer` relation (already fixed in GET, may need PATCH/DELETE)
- `app/dashboard/hr/hiring/interviews/page.tsx` - Frontend (may not block build)
- `hr-module/...` - Module directory files (may not be included in main build)

**Fix needed:** Remove or comment out the `include: { approver: ... }` or `include: { interviewer: ... }` blocks since these relations don't exist in the Prisma schema.

### Files Using `resolvedParams`: **30 files**
These files use `resolvedParams` - most should already have the declaration, but need verification:
- All files in `app/api/*/[id]/route.ts` pattern
- All files in `app/api/*/[id]/*/route.ts` pattern

**Fix needed:** Ensure each function has `const resolvedParams = await params` at the start of the try block.

### Last Known Build Error:
- `app/api/hr/leave/requests/route.ts:57` - `approver` relation doesn't exist

## Estimated Remaining Work

**Critical (blocks build):** ~1-3 files
- Prisma relation issues in main `app/api` directory

**Potentially problematic:** ~5-10 files  
- Files that might have missing `resolvedParams` declarations
- Other TypeScript type mismatches

**Total estimated:** **6-13 files** need fixes

## Progress Made

✅ **Fixed so far:**
- 177 files - Fixed `@payaid/db` imports
- 55 files - Fixed missing `resolvedParams` declarations  
- 25 files - Fixed duplicate function names
- 56 files - Fixed `requireHRAccess` → `requireModuleAccess`
- 3 files - Fixed `requireCommunicationAccess` → `requireModuleAccess`
- Multiple files - Fixed Decimal type issues, GSTIN issues, etc.

**Total files fixed:** **300+ files**

## Next Steps

1. Fix the `approver` relation issue in `app/api/hr/leave/requests/route.ts`
2. Verify all `resolvedParams` declarations are present
3. Run final build to catch any remaining errors

