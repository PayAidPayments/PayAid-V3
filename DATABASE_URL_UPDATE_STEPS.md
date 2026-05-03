# Database URL Updated - Next Steps ✅

## ✅ Step 1: Restart Development Server

After updating `.env.local`, you **must restart** your development server:

1. **Stop the current server:**
   - Press `Ctrl+C` in the terminal where `npm run dev` is running

2. **Start the server again:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

**Important:** Next.js only loads `.env.local` when the server starts. Changes won't take effect until restart.

## ✅ Step 2: Verify Connection

After restarting, check if the connection works:

### Option A: Check Browser Console
1. Open your browser (usually `http://localhost:3000`)
2. Open Developer Tools (F12)
3. Check Console tab for any database errors
4. Navigate to CRM dashboard - data should load

### Option B: Test Database Connection
Run this command in your terminal:
```bash
npx prisma db pull
```

If successful, you'll see:
```
✔ Introspected database
```

If there's an error, you'll see the specific issue.

## ✅ Step 3: Verify Data Appears

1. **Login to your application**
2. **Navigate to CRM Dashboard** (`/crm/[tenantId]/Home`)
3. **Check if data loads:**
   - Dashboard stats should appear
   - Cards should show numbers (not zeros)
   - Charts should display data

## Common Issues After Updating DATABASE_URL

### Issue 1: Still Getting Connection Errors

**Check:**
- Did you restart the server? (Required!)
- Is the connection string format correct?
- Does it include the password?
- Is Supabase project active (not paused)?

**Format should be:**
```
DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT-REF.supabase.co:6543/postgres?pgbouncer=true"
```

### Issue 2: Authentication Failed (P1000)

**Solution:**
- Verify password is correct
- Check if password contains special characters (may need URL encoding)
- Get fresh connection string from Supabase Dashboard

### Issue 3: Connection Timeout (P1001)

**Solution:**
- Check if Supabase project is paused
- Resume project if paused
- Wait 1-2 minutes after resuming
- Try again

### Issue 4: Data Still Not Visible

**If connection works but no data:**
1. Check if you have data in Supabase
2. Run seed script to create demo data:
   ```bash
   # In browser console (F12):
   fetch('/api/admin/seed-demo-data?comprehensive=true', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' }
   })
   ```
3. Wait 30-60 seconds for seeding
4. Refresh dashboard

## Quick Verification Checklist

- [ ] Updated `.env.local` with correct DATABASE_URL
- [ ] Restarted development server (Ctrl+C, then `npm run dev`)
- [ ] Verified Supabase project is active
- [ ] Checked browser console for errors
- [ ] Navigated to CRM dashboard
- [ ] Data appears (or ran seed script if empty)

## Still Having Issues?

If you're still seeing errors after restarting:

1. **Check terminal logs** - Look for Prisma/database errors
2. **Check browser console** - Look for API errors
3. **Verify connection string** - Copy fresh one from Supabase
4. **Test connection** - Run `npx prisma db pull`

The most common issue is forgetting to restart the server after updating `.env.local`!
