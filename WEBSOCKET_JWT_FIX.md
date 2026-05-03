# WebSocket JWT Authentication Fix

## Problem
WebSocket connections are failing with code 1006 (abnormal closure) due to JWT_SECRET mismatch between the Next.js app and WebSocket server.

## Root Cause
- The Next.js app's `signToken` function requires `JWT_SECRET` to be configured (throws error if not set)
- The WebSocket server falls back to `'change-me-in-production'` if `JWT_SECRET` is not in `.env`
- This mismatch causes token verification to fail, closing the connection abnormally

## Solution

### Step 1: Check Current JWT_SECRET
The Next.js app must have a JWT_SECRET configured (otherwise login would fail). Check where it's set:

1. Check `.env` file in project root
2. Check if it's set as an environment variable
3. Check if Next.js is reading it from a different location

### Step 2: Ensure Both Servers Use Same Secret

**Option A: Add to .env file (Recommended)**
```bash
# Add this to your .env file in the project root
JWT_SECRET=your-actual-secret-key-here
```

**Option B: Use Environment Variable**
Make sure both servers have access to the same `JWT_SECRET` environment variable.

### Step 3: Restart Both Servers
After updating the JWT_SECRET:

1. **Restart Next.js server:**
   ```bash
   npm run dev
   ```

2. **Restart WebSocket server:**
   ```bash
   npm run dev:websocket
   ```

### Step 4: Verify Configuration
Check the WebSocket server console output. You should see:
```
[WebSocket] JWT_SECRET configured: Yes (custom secret)
```

If you see:
```
[WebSocket] JWT_SECRET configured: Yes (using default - may cause auth failures)
```

Then the JWT_SECRET is not being loaded correctly.

## Debugging

### Check Server Logs
When you try to connect, check the WebSocket server console for:
- `[WebSocket] New connection attempt`
- `[WebSocket] Token received, length: XXX`
- `[WebSocket] ✅ Token verified successfully` or `[WebSocket] ❌ Token verification failed`

### Check Browser Console
Look for:
- `[WebSocket] Attempting to connect to ws://localhost:3001`
- `[WebSocket] ✅ Connected successfully` or error messages

### Common Issues

1. **JWT_SECRET not in .env**
   - Solution: Add `JWT_SECRET=your-secret` to `.env` file

2. **Different secrets in different places**
   - Solution: Ensure both servers read from the same `.env` file

3. **Token expired**
   - Solution: Re-login to get a fresh token

4. **Token format mismatch**
   - The WebSocket server expects `userId` and `tenantId` in the decoded token
   - Check that the token payload matches what the server expects

## Current Status

✅ WebSocket server is running on port 3001
✅ Enhanced error logging added
✅ Better error messages for debugging
⚠️ JWT_SECRET configuration needs to be verified

## Next Steps

1. Check your `.env` file for `JWT_SECRET`
2. If missing, add it (use the same value that Next.js is using)
3. Restart both servers
4. Try connecting again and check the server logs for detailed error messages
