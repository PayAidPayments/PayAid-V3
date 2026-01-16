# WebSocket Connection Fix - Code 1006 Error

## Problem
WebSocket connections are failing with code 1006 (abnormal closure), causing repeated error messages in the console.

## Root Cause
Code 1006 indicates the connection was closed abnormally without a proper close handshake. This typically happens when:
1. **JWT_SECRET mismatch** between Next.js app and WebSocket server (most common)
2. Token verification fails on the server
3. Server crashes during connection setup
4. Network issues

## Fixes Applied

### 1. Retry Logic Improvements
- Added maximum retry limit (3 attempts) to prevent infinite loops
- Stopped automatic retries for code 1006 and 1008 (auth failures)
- Added clear error messages when retries are exhausted

### 2. Server-Side Improvements
- Added `ws.readyState === WebSocket.OPEN` checks before sending messages
- Improved error handling to prevent crashes

### 3. Better Diagnostics
- Enhanced logging for connection lifecycle
- Clear error messages pointing to specific issues

## How to Fix

### Step 1: Verify JWT_SECRET Configuration

**Check Next.js JWT_SECRET:**
The Next.js app reads JWT_SECRET from environment variables. Check:
- `.env` file in project root
- Environment variables set in your shell/IDE

**Check WebSocket Server JWT_SECRET:**
The WebSocket server reads from:
- `process.env.JWT_SECRET` (first priority)
- `process.env.NEXTAUTH_SECRET` (fallback)
- `'change-me-in-production'` (default - will cause failures)

### Step 2: Ensure Both Use Same Secret

**Option A: Add to .env file (Recommended)**
```bash
# Add this to your .env file in the project root
JWT_SECRET=your-actual-secret-key-here
```

**Option B: Set Environment Variable**
```powershell
# PowerShell
$env:JWT_SECRET="your-actual-secret-key-here"

# Then start servers
npm run dev
npm run dev:websocket
```

### Step 3: Restart Both Servers

1. **Stop all running servers** (Ctrl+C in all terminal windows)
2. **Restart Next.js server:**
   ```bash
   npm run dev
   ```
3. **Restart WebSocket server:**
   ```bash
   npm run dev:websocket
   ```

### Step 4: Verify Configuration

**Check WebSocket Server Console:**
When the WebSocket server starts, you should see:
```
[WebSocket] JWT_SECRET configured: Yes (custom secret)
```

If you see:
```
[WebSocket] JWT_SECRET configured: Yes (using default - may cause auth failures)
```
Then JWT_SECRET is not being loaded correctly.

**Check Server Logs on Connection:**
When you try to connect, the WebSocket server console should show:
```
[WebSocket] ========================================
[WebSocket] New connection attempt from: ...
[WebSocket] Token received, length: XXX
[WebSocket] ✅ Token verified successfully for user: ... tenant: ...
```

If you see:
```
[WebSocket] ❌ Token verification failed: ...
```
Then there's a JWT_SECRET mismatch.

## Testing

1. **Open browser console** (F12)
2. **Navigate to voice agent demo page**
3. **Check console logs:**
   - Should see: `[WebSocket] Attempting to connect to ws://localhost:3001`
   - Should see: `[WebSocket] ✅ Connected successfully` (if working)
   - Should see error messages if failing

4. **Check WebSocket server console:**
   - Should see connection attempt logs
   - Should see token verification result

## Common Issues

### Issue: "JWT_SECRET configured: Yes (using default)"
**Solution:** Add `JWT_SECRET` to your `.env` file and restart the WebSocket server.

### Issue: "Token verification failed"
**Solution:** 
1. Ensure `JWT_SECRET` in `.env` matches what Next.js is using
2. Check that the token is not expired
3. Verify the token is being sent correctly in the WebSocket URL

### Issue: "Connection timeout"
**Solution:**
1. Verify WebSocket server is running: `netstat -ano | Select-String ":3001.*LISTENING"`
2. Check firewall settings
3. Verify `NEXT_PUBLIC_WEBSOCKET_URL` in `.env` matches server port

## Next Steps

After fixing JWT_SECRET:
1. Clear browser cache and reload
2. Check both server consoles for errors
3. Try connecting again
4. If still failing, check server logs for specific error messages

## Debugging Commands

**Check if WebSocket server is running:**
```powershell
netstat -ano | Select-String ":3001.*LISTENING"
```

**Check what process is using port 3001:**
```powershell
Get-NetTCPConnection -LocalPort 3001 | Select-Object -Property LocalAddress,LocalPort,State,OwningProcess
```

**Kill process on port 3001 (if needed):**
```powershell
$process = Get-NetTCPConnection -LocalPort 3001 | Select-Object -ExpandProperty OwningProcess
Stop-Process -Id $process -Force
```
