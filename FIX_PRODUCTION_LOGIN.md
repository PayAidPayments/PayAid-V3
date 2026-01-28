# Fix Production Login Issue

## Problem
Login fails with `admin@demo.com` on https://payaid-v3.vercel.app/login

## Solution Steps

### Option 1: Use Browser (Easiest)
1. Visit: https://payaid-v3.vercel.app/api/admin/ensure-demo-user
2. This will check and create the demo user if needed
3. Try logging in again with:
   - Email: `admin@demo.com`
   - Password: `Test@1234`

### Option 2: Reset Password (If user exists)
If the user exists but password doesn't work, use browser console or curl:

**Browser Console:**
```javascript
fetch('https://payaid-v3.vercel.app/api/admin/ensure-demo-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(console.log)
```

**Or use curl:**
```bash
curl -X POST https://payaid-v3.vercel.app/api/admin/ensure-demo-user
```

### Option 3: Check Health & Database
1. Visit: https://payaid-v3.vercel.app/api/health
   - Verify DATABASE_URL is configured
   - Verify database connection works

2. Check Vercel Logs:
   - Go to Vercel Dashboard → Project → Functions → View Logs
   - Look for `/api/auth/login` errors
   - Check for database connection errors

## Expected Credentials
- **Email:** `admin@demo.com`
- **Password:** `Test@1234`

## Common Issues

### Database Connection Error
- Check Vercel environment variables
- Ensure `DATABASE_URL` is set correctly
- Verify database is accessible from Vercel

### User Doesn't Exist
- Use `/api/admin/ensure-demo-user` endpoint to create
- Or use `/api/admin/seed-demo-data` to seed all demo data

### Password Mismatch
- Use POST to `/api/admin/ensure-demo-user` to reset password
- Password will be reset to `Test@1234`

## After Fixing
1. Try logging in again
2. If still fails, check browser console (F12) for errors
3. Check Vercel function logs for detailed error messages
