# Login Troubleshooting Guide

## Quick Fixes

### Step 1: Check Health Status
Visit: https://payaid-v3.vercel.app/api/health

This will show:
- ✅ Database connection status
- ✅ JWT_SECRET configuration
- ✅ Environment status

**If database is not connected:**
- Check Vercel environment variables
- Verify `DATABASE_URL` is set correctly
- Check database is accessible

**If JWT_SECRET is not configured:**
- Check Vercel environment variables
- Verify `JWT_SECRET` is set and not default value

### Step 2: Ensure Demo User Exists
Visit: https://payaid-v3.vercel.app/api/admin/ensure-demo-user

This will:
- ✅ Check if `admin@demo.com` exists
- ✅ Create user if missing
- ✅ Reset password if needed

**Expected credentials:**
- Email: `admin@demo.com`
- Password: `Test@1234`

### Step 3: Reset Password (If user exists but login fails)
Visit: https://payaid-v3.vercel.app/api/admin/ensure-demo-user

Or use POST:
```bash
curl -X POST https://payaid-v3.vercel.app/api/admin/ensure-demo-user
```

### Step 4: Check Browser Console
1. Open browser console (F12)
2. Try logging in
3. Check for errors in console
4. Check Network tab for API response

## Common Error Messages

### "Login failed" (Generic)
**Possible causes:**
- Database connection timeout
- JWT_SECRET not configured
- User doesn't exist
- Password mismatch

**Solution:**
1. Check `/api/health` endpoint
2. Ensure demo user exists: `/api/admin/ensure-demo-user`
3. Try resetting password: POST to `/api/admin/ensure-demo-user`

### "Invalid email or password"
**Possible causes:**
- User doesn't exist
- Password is incorrect
- Password hash mismatch

**Solution:**
1. Visit `/api/admin/ensure-demo-user` to create/reset user
2. Use exact credentials: `admin@demo.com` / `Test@1234`

### "Database connection failed"
**Possible causes:**
- DATABASE_URL not configured in Vercel
- Database server is down
- Connection pool exhausted

**Solution:**
1. Check Vercel environment variables
2. Verify database is running
3. Check `/api/health` for connection status

### "Request timed out"
**Possible causes:**
- Database is slow
- Cold start on Vercel
- Too many concurrent requests

**Solution:**
1. Wait a moment and try again
2. Check Vercel function logs
3. Verify database performance

## Diagnostic Steps

### 1. Check Health Endpoint
```bash
curl https://payaid-v3.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "configured": true,
      "connected": true
    },
    "jwt": {
      "configured": true
    }
  }
}
```

### 2. Check Demo User
```bash
curl https://payaid-v3.vercel.app/api/admin/ensure-demo-user
```

Expected response:
```json
{
  "success": true,
  "message": "Demo user exists",
  "user": {
    "email": "admin@demo.com",
    "hasPassword": true
  }
}
```

### 3. Test Login API Directly
```bash
curl -X POST https://payaid-v3.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Test@1234"}'
```

Expected response:
```json
{
  "token": "...",
  "refreshToken": "...",
  "user": {...}
}
```

## Browser Console Method

If login page isn't working, try logging in via console:

```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@demo.com',
    password: 'Test@1234'
  })
})
.then(r => r.json())
.then(data => {
  if (data.token) {
    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    window.location.href = '/home'
  } else {
    console.error('Login failed:', data)
  }
})
.catch(err => console.error('Error:', err))
```

## Vercel Environment Variables Checklist

Ensure these are set in Vercel:
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `JWT_SECRET` - Secret key for JWT tokens (not default value)
- ✅ `JWT_REFRESH_SECRET` - Secret key for refresh tokens (optional)

## Still Not Working?

1. Check Vercel function logs:
   - Go to Vercel Dashboard → Project → Functions → View Logs
   - Look for `/api/auth/login` errors
   - Check for specific error messages

2. Check browser console:
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

3. Verify credentials:
   - Email: `admin@demo.com` (exact, case-insensitive)
   - Password: `Test@1234` (exact, case-sensitive)
