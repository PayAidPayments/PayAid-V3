# WebSocket Code 1006 Troubleshooting Guide

## Problem
WebSocket connections are failing with code 1006 (abnormal closure), causing the connection to close immediately after being established.

## What is Code 1006?
Code 1006 indicates an **abnormal closure** - the connection was closed without a proper close handshake. This typically happens when:
1. The server crashes during connection setup
2. An unhandled exception occurs in the connection handler
3. The server closes the connection immediately after authentication
4. Network issues or firewall blocking

## Current Status
- ✅ JWT_SECRET is configured correctly
- ✅ Token signing/verification works (tested)
- ✅ WebSocket server is running on port 3001
- ❌ Connections are closing immediately with code 1006

## Diagnostic Steps

### Step 1: Check WebSocket Server Console

**Open the terminal where you ran `npm run dev:websocket`** and look for:

1. **On Server Startup:**
   ```
   [WebSocket] JWT_SECRET configured: Yes (custom secret)
   [WebSocket] Server listening on port 3001
   ✅ Voice WebSocket Server running on ws://localhost:3001
   ```

2. **When You Try to Connect (from browser):**
   ```
   [WebSocket] ========================================
   [WebSocket] New connection attempt from: ...
   [WebSocket] Request URL: /?token=...&agentId=...
   [WebSocket] Token received, length: XXX
   [WebSocket] ✅ Token verified successfully for user: ... tenant: ...
   [WebSocket] ✅ Connection confirmed message sent
   ```

**If you see:**
- `[WebSocket] ❌ Token verification failed:` → JWT_SECRET mismatch
- `[WebSocket] ❌ Fatal error in connection handler:` → Server error
- `[WebSocket] Unhandled Rejection` → Unhandled promise rejection
- No logs at all → Server not receiving connections

### Step 2: Test Connection Manually

Use the test script to verify the connection:

```bash
# First, get your JWT token from the browser console:
# In browser console: localStorage.getItem('token') or check your auth store

# Then run:
node scripts/test-websocket-connection.js YOUR_TOKEN_HERE YOUR_AGENT_ID
```

This will show you:
- If the connection opens
- If the server sends a confirmation message
- The exact close code and reason
- Any errors from the server

### Step 3: Check Server Logs for Errors

Look for these in the WebSocket server console:

**Common Errors:**
1. **Token Verification Failed:**
   ```
   [WebSocket] ❌ Token verification failed: ...
   ```
   → Fix: Ensure JWT_SECRET matches between Next.js and WebSocket server

2. **Fatal Error in Connection Handler:**
   ```
   [WebSocket] ❌ Fatal error in connection handler: ...
   ```
   → This indicates a code error - check the error message

3. **Unhandled Rejection:**
   ```
   [WebSocket] Unhandled Rejection at: ...
   ```
   → This indicates an async error that's not being caught

4. **No Connection Logs:**
   → Server might not be receiving connections (check firewall, port, URL)

### Step 4: Verify Server is Actually Running

```powershell
# Check if server is listening
netstat -ano | Select-String ":3001.*LISTENING"

# Should show:
# TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING       <PID>
```

### Step 5: Check Browser Console

In your browser console, you should see:
```
[WebSocket] Attempting to connect to ws://localhost:3001
[WebSocket] ✅ Connected successfully to ws://localhost:3001
[WebSocket] Server ready: WebSocket connection established
```

**If you see:**
- `[WebSocket] Connection closed abnormally` → Server closed the connection
- `[WebSocket] Connection error` → Network or server issue
- No connection logs → Connection never established

## Common Fixes

### Fix 1: JWT_SECRET Mismatch

**Symptoms:**
- Server logs show: `[WebSocket] ❌ Token verification failed`
- Close code: 1008 (not 1006, but similar issue)

**Solution:**
1. Ensure `JWT_SECRET` is in `.env` file
2. Restart both servers:
   ```bash
   # Terminal 1
   npm run dev
   
   # Terminal 2
   npm run dev:websocket
   ```
3. Verify server startup shows: `JWT_SECRET configured: Yes (custom secret)`

### Fix 2: Server Crashes on Connection

**Symptoms:**
- Server logs show: `[WebSocket] ❌ Fatal error in connection handler`
- Server might restart or stop responding

**Solution:**
1. Check the error message in server logs
2. Look for the stack trace
3. Common causes:
   - Database connection issues (Prisma)
   - Missing environment variables
   - Code errors in connection handler

### Fix 3: Unhandled Promise Rejection

**Symptoms:**
- Server logs show: `[WebSocket] Unhandled Rejection`
- Connection closes immediately

**Solution:**
1. Check the rejection reason in server logs
2. Look for async operations that aren't being awaited
3. Check `createCall`, `handleAudioChunk`, or other async methods

### Fix 4: URL Parsing Error

**Symptoms:**
- Server logs show: `[WebSocket] ❌ Failed to parse URL`
- Close code: 1002

**Solution:**
- This is now handled with better error messages
- Check the URL format in browser console

## Next Steps

1. **Check the WebSocket server console** - This is the most important step!
2. **Run the test script** to verify the connection manually
3. **Share the server console output** if the issue persists

## What to Share for Further Help

If the issue persists, please share:

1. **WebSocket Server Console Output:**
   - Startup messages
   - Connection attempt logs
   - Any error messages

2. **Browser Console Output:**
   - Connection attempt logs
   - Error messages
   - Close codes

3. **Test Script Output:**
   ```bash
   node scripts/test-websocket-connection.js YOUR_TOKEN YOUR_AGENT_ID
   ```

4. **Server Status:**
   ```powershell
   netstat -ano | Select-String ":3001.*LISTENING"
   ```

## Expected Behavior After Fix

When working correctly, you should see:

**Server Console:**
```
[WebSocket] New connection attempt from: ::1
[WebSocket] Token received, length: 256
[WebSocket] ✅ Token verified successfully for user: ... tenant: ...
[WebSocket] ✅ Connection confirmed message sent
```

**Browser Console:**
```
[WebSocket] ✅ Connected successfully to ws://localhost:3001
[WebSocket] Server ready: WebSocket connection established
```

**No code 1006 errors!**
