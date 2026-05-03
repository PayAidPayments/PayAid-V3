# Phase 1: Next Steps - Implementation Complete

**Date:** January 2026  
**Status:** ✅ **COMPLETE**

---

## ✅ Completed Tasks

### 1. Database Migration Scripts Created

**Created Files:**
- `scripts/run-phase1-migrations.ts` - Automated migration script
- `scripts/initialize-default-roles.ts` - Role initialization script

**Usage:**
```bash
# Run all Phase 1 migrations
npx tsx scripts/run-phase1-migrations.ts

# Initialize default roles for all tenants
npx tsx scripts/initialize-default-roles.ts

# Initialize default roles for specific tenant
npx tsx scripts/initialize-default-roles.ts --tenant-id <tenant-id>
```

---

### 2. Environment Variables Updated

**Updated File:** `env.example`

**New Variables Added:**
```env
# JWT (Phase 1: Enhanced Authentication)
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"
JWT_EXPIRES_IN="15m" # Access token expiry (15 minutes)
JWT_REFRESH_EXPIRES_IN="7d" # Refresh token expiry (7 days)
JWT_ISSUER="payaid.store" # Token issuer

# Phase 1: Tenant Resolution (Development)
DEV_TENANT_SLUG="dev-tenant"
```

---

## 📋 Manual Steps Required

### Step 1: Update Your `.env` File

Copy the new variables from `env.example` to your `.env` file:

```env
# Generate secure secrets
# For JWT_SECRET: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# For JWT_REFRESH_SECRET: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

JWT_SECRET="<generate-64-char-hex-string>"
JWT_REFRESH_SECRET="<generate-64-char-hex-string>"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
JWT_ISSUER="payaid.store"
DEV_TENANT_SLUG="dev-tenant"
```

### Step 2: Run Database Migrations

**Option A: Use the automated script (Recommended)**
```bash
npx tsx scripts/run-phase1-migrations.ts
```

**Option B: Run manually**
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Apply RLS policies (PostgreSQL)
psql $DATABASE_URL -f prisma/migrations/phase1-rls-policies.sql
```

**Note:** On Windows, if you get file lock errors during `prisma generate`, you can:
- Close any running dev servers
- Close Prisma Studio if open
- Retry the command
- Or skip `prisma generate` and just run `npx prisma db push --skip-generate`

### Step 3: Initialize Default Roles

**For all tenants:**
```bash
npx tsx scripts/initialize-default-roles.ts
```

**For specific tenant:**
```bash
npx tsx scripts/initialize-default-roles.ts --tenant-id <tenant-id>
```

This creates:
- **Admin** role (full access)
- **Manager** role (team management)
- **User** role (basic access)

---

## 🔍 Verification Steps

### 1. Verify Database Schema
```bash
npx prisma studio
```
Check that these tables exist:
- `Role`
- `UserRole`
- `Permission`
- `RolePermission`
- `UserPermission`
- `ModuleAccess`

### 2. Verify Environment Variables
```bash
# Check if variables are set
node -e "console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing')"
node -e "console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Missing')"
```

### 3. Test Login Flow
1. Start dev server: `npm run dev`
2. Login with existing user
3. Check browser console/network tab for JWT token
4. Decode token at https://jwt.io to verify it contains:
   - `roles` array
   - `permissions` array
   - `modules` array
   - `tenant_id`
   - `tenant_slug`

### 4. Verify Default Roles
```typescript
import { prisma } from '@/lib/db/prisma'

const roles = await prisma.role.findMany({
  where: { tenantId: 'your-tenant-id' },
})

console.log('Roles:', roles.map(r => r.roleName))
// Should show: Admin, Manager, User
```

---

## 🚨 Troubleshooting

### Issue: Prisma Generate File Lock Error
**Solution:**
- Close all running Node processes
- Close Prisma Studio
- Run: `npx prisma db push --skip-generate` instead

### Issue: RLS Policies Already Exist
**Solution:**
- This is normal if running migrations multiple times
- The script handles "already exists" errors gracefully
- Check that policies are active: `\d+ table_name` in psql

### Issue: No Roles Created
**Solution:**
- Check tenant exists: `SELECT * FROM "Tenant" WHERE id = 'tenant-id'`
- Run initialization script manually
- Check console for errors

### Issue: JWT Token Missing Roles/Permissions
**Solution:**
- Verify user has roles assigned
- Check `UserRole` table: `SELECT * FROM "UserRole" WHERE userId = 'user-id'`
- Verify login route is using new RBAC functions
- Check console logs during login

---

## 📝 Next Steps After Phase 1

Once Phase 1 is complete and verified:

1. **Phase 2: Module Framework**
   - Module registry
   - Navigation system
   - Permission checking integration
   - Module switching

2. **Phase 3: SSO Implementation**
   - Email/Password auth (already done)
   - SAML integration
   - OAuth2 integration
   - MFA support

3. **Testing**
   - Unit tests for RBAC functions
   - Integration tests for login flow
   - E2E tests for tenant isolation

---

## ✅ Completion Checklist

- [ ] Environment variables updated in `.env`
- [ ] Database migrations run successfully
- [ ] RLS policies applied
- [ ] Default roles initialized
- [ ] Login flow tested
- [ ] JWT tokens contain roles/permissions
- [ ] Tenant resolution working
- [ ] Permission checking working

---

**Status:** ✅ Scripts and configuration files created. Ready for manual execution.
