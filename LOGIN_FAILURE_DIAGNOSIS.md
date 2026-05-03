# Login Failure Diagnosis

## Issue
Login page at https://payaid-v3.vercel.app/login shows "Login Failed" when attempting to log in with:
- Email: `admin@demo.com`
- Password: (user entered password)

## Possible Causes

### 1. **Database Connection Issue**
- Vercel may not have `DATABASE_URL` environment variable configured
- Database may be unreachable from Vercel
- Connection pool may be exhausted

### 2. **User Doesn't Exist in Production Database**
- Demo user `admin@demo.com` may not exist in production database
- Password hash may be incorrect

### 3. **Environment Variables Missing**
- `DATABASE_URL` not set in Vercel
- `JWT_SECRET` not set in Vercel
- Other required env vars missing

### 4. **API Timeout**
- Login API may be timing out (8 second limit)
- Database queries taking too long
- Cold start delays

## Solutions

### Immediate Fix: Verify Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set:
   - `DATABASE_URL` - Your production database connection string
   - `JWT_SECRET` - A secure random string for JWT signing
   - `ENABLE_RBAC` - Set to `false` if RBAC tables don't exist

### Create Demo User in Production

Run the seed script or use the API endpoint to create the demo user:

**Option 1: Use Seed API Endpoint**
```bash
# Call the seed endpoint (if available)
curl -X POST https://payaid-v3.vercel.app/api/admin/seed-demo-data \
  -H "Content-Type: application/json"
```

**Option 2: Direct Database Query**
If you have database access, run:
```sql
-- Check if user exists
SELECT id, email, name, role, "tenantId" FROM "User" WHERE email = 'admin@demo.com';

-- If user doesn't exist, create it (you'll need tenant ID)
INSERT INTO "User" (email, name, password, role, "tenantId", "createdAt", "updatedAt")
VALUES (
  'admin@demo.com',
  'Admin User',
  '$2a$10$...', -- bcrypt hash of 'Test@1234'
  'owner',
  'your-tenant-id',
  NOW(),
  NOW()
);
```

### Check Login API Logs

1. Go to Vercel Dashboard → Your Project → Functions → View Logs
2. Look for `/api/auth/login` logs
3. Check for:
   - Database connection errors
   - User not found errors
   - Token generation errors
   - Timeout errors

### Test Login API Directly

```bash
curl -X POST https://payaid-v3.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Test@1234"}'
```

Expected response:
```json
{
  "user": { ... },
  "tenant": { ... },
  "token": "...",
  "refreshToken": "..."
}
```

Error response:
```json
{
  "error": "Login failed",
  "message": "..."
}
```

## Next Steps

1. ✅ Check Vercel environment variables
2. ✅ Verify demo user exists in production database
3. ✅ Check Vercel function logs for errors
4. ✅ Test login API directly
5. ✅ If user doesn't exist, run seed script or create manually
