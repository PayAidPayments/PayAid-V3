# Debugging "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

## Quick Fix Steps

### 1. Check Browser Console
- Open DevTools (F12)
- Go to **Console** tab
- Look for the exact error and which API endpoint is failing
- Go to **Network** tab
- Find the failed request (red status)
- Click on it and check the **Response** tab

### 2. Common Causes

#### A. Missing Environment Variables
Check your `.env` file has all required variables:
- `DATABASE_URL`
- `GOOGLE_AI_STUDIO_API_KEY` (you just updated this)
- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- Any other API keys your app uses

#### B. Database Connection Error
If the database connection fails, API routes might return error pages.

Check if DATABASE_URL is correct in `.env`:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.zjcutguakjavahdrytxc.supabase.co:5432/postgres?schema=public"
```

#### C. Build/Compilation Error
The server might have compilation errors. Check the terminal where `npm run dev` is running for errors.

### 3. Quick Fixes

#### Option 1: Restart Server
```bash
# Stop server (Ctrl+C)
# Then restart
npm run dev
```

#### Option 2: Check Specific API Endpoint
If you know which API is failing, test it directly:
```bash
# Example: Test contacts API
curl http://localhost:3000/api/contacts
```

#### Option 3: Verify Environment Variables
Make sure all required env vars are set:
```bash
# Check if .env file exists and has content
cat .env
```

### 4. Check Server Logs
Look at the terminal where `npm run dev` is running. You should see:
- Compilation errors
- Runtime errors
- Database connection errors
- API route errors

### 5. Common API Routes That Might Fail

- `/api/auth/login` - If JWT_SECRET is missing
- `/api/contacts` - If database connection fails
- `/api/ai/chat` - If API keys are missing
- `/api/settings/profile` - If authentication fails

### 6. Verify Next.js is Running
Check if Next.js compiled successfully:
- Look for "Ready" message in terminal
- Check for "compiled successfully" message
- Look for any error messages in red

### 7. Clear Next.js Cache
Sometimes clearing the cache helps:
```bash
# Stop server
# Delete .next folder
rm -rf .next
# Or on Windows:
Remove-Item -Recurse -Force .next

# Restart server
npm run dev
```

## Still Not Working?

1. **Share the exact error from browser console**
2. **Share which API endpoint is failing** (from Network tab)
3. **Share any errors from the server terminal**

This will help identify the exact issue.

