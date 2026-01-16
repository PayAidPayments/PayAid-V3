# WebSocket Connection Diagnostic Guide

## Current Status
✅ WebSocket server is running on port 3001 (process 2816)
✅ Enhanced logging enabled
⚠️ Connection failing with code 1006 (abnormal closure)

## What Code 1006 Means
Code 1006 = "Abnormal Closure" - The connection was established but then immediately closed without a proper close frame. This usually means:
- The server closed the connection due to an error
- Authentication failed (JWT_SECRET mismatch)
- An unhandled error occurred during connection setup

## How to Diagnose

### Step 1: Check WebSocket Server Console
Look at the terminal where you ran `npm run dev:websocket`. You should see logs like:

**On Server Start:**
```
[WebSocket] JWT_SECRET configured: Yes (custom secret)
[WebSocket] Server listening on port 3001
```

**When Connection Attempted:**
```
[WebSocket] ========================================
[WebSocket] New connection attempt from: ::1
[WebSocket] Request URL: /?token=XXX&agentId=XXX
[WebSocket] AgentId from URL: XXX
[WebSocket] Token received, length: XXX
```

**Then either:**
- ✅ `[WebSocket] ✅ Token verified successfully` - Good!
- ❌ `[WebSocket] ❌ Token verification failed` - JWT_SECRET mismatch!

**If connection closes:**
```
[WebSocket] ========================================
[WebSocket] Connection closed. Code: XXX Reason: XXX
```

### Step 2: Check Browser Console
Open browser DevTools (F12) and look for:

**Connection Attempt:**
```
[WebSocket] Attempting to connect to ws://localhost:3001
[WebSocket] Full URL length: XXX characters
[WebSocket] Token length: XXX characters
[WebSocket] AgentId: XXX
[WebSocket] WebSocket object created, state: 0 (CONNECTING)
```

**Then either:**
- ✅ `[WebSocket] ✅ Connected successfully` - Good!
- ❌ `[WebSocket] Disconnected` with error details

### Step 3: Most Common Issue - JWT_SECRET Mismatch

**Symptoms:**
- Server console shows: `[WebSocket] ❌ Token verification failed`
- Server console shows: `JWT_SECRET configured: Yes (using default - may cause auth failures)`
- Connection closes immediately after opening

**Solution:**
1. Check your `.env` file has `JWT_SECRET` set:
   ```bash
   JWT_SECRET=your-actual-secret-key-here
   ```

2. **Important:** The Next.js app and WebSocket server MUST use the same JWT_SECRET!

3. To find what JWT_SECRET Next.js is using:
   - Check your `.env` file
   - Or check Next.js server logs when you log in (it should show if JWT_SECRET is configured)

4. After updating `.env`, restart BOTH servers:
   ```bash
   # Terminal 1 - Next.js
   npm run dev
   
   # Terminal 2 - WebSocket
   npm run dev:websocket
   ```

### Step 4: Check Connection Flow

The connection should follow this sequence:

1. **Client:** `[WebSocket] Attempting to connect...`
2. **Server:** `[WebSocket] New connection attempt...`
3. **Server:** `[WebSocket] Token received...`
4. **Server:** `[WebSocket] ✅ Token verified successfully...` OR `[WebSocket] ❌ Token verification failed`
5. **Server:** `[WebSocket] ✅ Connection confirmed message sent`
6. **Client:** `[WebSocket] ✅ Connected successfully`
7. **Client:** `[WebSocket] Server ready` (receives 'connected' message)

**If it stops at step 4 with "Token verification failed":**
→ JWT_SECRET mismatch - fix `.env` file

**If it stops at step 5:**
→ Connection is closing before client receives message - check for errors in server console

**If you don't see step 2:**
→ Connection isn't reaching server - check firewall, port, or server isn't running

## Quick Fix Checklist

- [ ] WebSocket server is running (check: `netstat -ano | Select-String ":3001.*LISTENING"`)
- [ ] `.env` file has `JWT_SECRET` set
- [ ] JWT_SECRET in `.env` matches what Next.js is using
- [ ] Both servers restarted after changing `.env`
- [ ] Checked server console for error messages
- [ ] Checked browser console for connection logs
- [ ] Token is not expired (try logging out and back in)

## Next Steps

1. **Check the WebSocket server console** (where you ran `npm run dev:websocket`)
   - Look for the detailed logs I added
   - Find where the connection is failing

2. **Share the server console output** - The logs will show exactly what's happening:
   - Is the connection reaching the server?
   - Is token verification failing?
   - What error is causing the connection to close?

3. **Check JWT_SECRET configuration:**
   - Server console should show: `JWT_SECRET configured: Yes (custom secret)`
   - If it shows `(using default - may cause auth failures)`, that's the problem!

The enhanced logging will now show exactly what's happening at each step!
