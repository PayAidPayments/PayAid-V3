# Vercel Login Fix - Phase 1 RBAC Issue

## Problem
Login at https://payaid-v3.vercel.app/login is stuck on "signing in..." for more than 5 minutes.

## Root Cause
The Phase 1 RBAC implementation is trying to query tables (`UserRole`, `UserPermission`, etc.) that may not exist on Vercel production yet. This causes the queries to hang or fail silently, blocking the login response.

## Solution Applied

### 1. Enhanced Error Handling
- Added checks for missing tables (Prisma error codes P2021, P2001)
- Graceful fallback to legacy role system
- Aggressive timeouts (500ms check, 1s fetch)

### 2. Updated Files
- `app/api/auth/login/route.ts` - Better RBAC query handling with timeouts
- `lib/rbac/permissions.ts` - Error handling for missing tables

### 3. Fallback Behavior
- If RBAC tables don't exist → Use legacy `user.role` field
- If RBAC queries timeout → Use legacy `user.role` field
- If RBAC queries fail → Use legacy `user.role` field

## Immediate Action Required

### Option 1: Deploy the Fix (Recommended)
The code changes will allow login to work even without RBAC tables:

```bash
git add .
git commit -m "Fix: Login hanging on Vercel - add RBAC error handling"
git push
```

Vercel will auto-deploy. Login should work immediately.

### Option 2: Run Migrations on Vercel
If you want RBAC to work properly, run migrations:

1. **Via Vercel CLI:**
```bash
vercel env pull .env.production
npx prisma migrate deploy
```

2. **Or via Supabase Dashboard:**
   - Go to Supabase Dashboard > SQL Editor
   - Run the migration: `prisma/migrations/phase1-rls-policies.sql`
   - Or use Prisma Migrate in Vercel build

3. **Or add to Vercel Build Command:**
```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build"
}
```

## Testing

After deployment:
1. Try login at https://payaid-v3.vercel.app/login
2. Should complete in < 2 seconds (not 5+ minutes)
3. Check Vercel logs for RBAC warnings (expected if tables don't exist)

## Expected Behavior

### With RBAC Tables:
- Login fetches roles/permissions from RBAC tables
- Token includes roles, permissions, modules
- Full Phase 1 functionality

### Without RBAC Tables (Current State):
- Login uses legacy `user.role` field
- Token includes role (backward compatible)
- Login works but RBAC features unavailable

## Next Steps

1. ✅ **Deploy fix** (allows login to work)
2. ⏳ **Run migrations on Vercel** (enables full RBAC)
3. ⏳ **Initialize default roles** (creates Admin/Manager/User roles)

## Verification

Check Vercel logs after deployment:
```
[LOGIN] RBAC check failed (tables may not exist), using legacy role
[LOGIN] Roles and permissions resolved { rolesCount: 1, fallbackUsed: true }
```

This is expected and means login will work!
