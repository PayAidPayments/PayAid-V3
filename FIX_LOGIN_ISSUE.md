# Fix Login Issue - admin@demo.com

## Problem
Unable to login with `admin@demo.com` and `Test@1234` on production.

## Root Causes
1. **Database Connection Pool Exhausted**: The Supabase pooler has reached max clients
2. **Admin User May Not Exist**: User might not be created in production database

## Solutions

### Solution 1: Create Admin User via Browser Console (Easiest)

1. Go to: https://payaid-v3.vercel.app/login
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Paste and run:

```javascript
fetch('https://payaid-v3.vercel.app/api/admin/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@demo.com',
    password: 'Test@1234'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Result:', data);
  if (data.success) {
    alert('✅ User created! You can now login with:\nEmail: admin@demo.com\nPassword: Test@1234');
  } else {
    alert('❌ Error: ' + (data.message || data.error));
  }
})
.catch(err => {
  console.error('❌ Error:', err);
  alert('❌ Failed: ' + err.message);
});
```

### Solution 2: Fix Database Connection Pool Issue

The error "max clients reached" indicates the Supabase pooler is exhausted. 

**Option A: Use Direct Connection (Recommended)**

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select project: **payaid-v3**
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` for **Production**
5. Change from pooler URL (port 6543) to direct connection (port 5432):
   - **Pooler URL:** `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres`
   - **Direct URL:** `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?schema=public`
6. Click **Save**
7. Vercel will auto-redeploy

**Option B: Wait and Retry**

The pooler might be temporarily exhausted. Wait 1-2 minutes and try creating the user again.

### Solution 3: Use PowerShell Script

```powershell
$body = @{
    email = "admin@demo.com"
    password = "Test@1234"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://payaid-v3.vercel.app/api/admin/reset-password" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json)
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)"
}
```

## After Creating User

1. Go to: https://payaid-v3.vercel.app/login
2. Enter:
   - **Email:** `admin@demo.com`
   - **Password:** `Test@1234`
3. Click **Login**

## Troubleshooting

### Still Can't Login?

1. **Check Browser Console** for errors
2. **Check Network Tab** - look at the `/api/auth/login` request
3. **Verify User Exists** - Try creating user again (Solution 1)
4. **Check Database Connection** - Verify `DATABASE_URL` in Vercel

### Database Connection Errors

If you see database connection errors:
1. Check Supabase project status (might be paused)
2. Verify `DATABASE_URL` is correct in Vercel
3. Try switching to direct connection (Solution 2, Option A)

## Expected Result

After successful setup:
- ✅ User exists in database
- ✅ Password is set to `Test@1234`
- ✅ Login works at https://payaid-v3.vercel.app/login
