# WebSocket Connection Debugging Guide

## Current Status
- ✅ Enhanced logging added to both client and server
- ✅ Better error messages for diagnostics
- ⚠️ Connection failing with code 1006 (abnormal closure)

## What to Check

### 1. Verify WebSocket Server is Running

**Check if server is listening:**
```powershell
netstat -ano | Select-String ":3001.*LISTENING"
```

**If not running, start it:**
```bash
npm run dev:websocket
```

You should see in the console:
```
[WebSocket] JWT_SECRET configured: Yes (custom secret) or (using default...)
[WebSocket] Server listening on port 3001
```

### 2. Check Browser Console

When you try to connect, you should see:
```
[WebSocket] Attempting to connect to ws://localhost:3001
[WebSocket] Full URL length: XXX characters
[WebSocket] Token length: XXX characters
[WebSocket] AgentId: XXX
[WebSocket] WebSocket object created, state: 0 (CONNECTING)
```

Then either:
- ✅ `[WebSocket] ✅ Connected successfully` - Good!
- ❌ `[WebSocket] Disconnected` with error details - Check the error

### 3. Check WebSocket Server Console

When a connection is attempted, you should see:
```
[WebSocket] ========================================
[WebSocket] New connection attempt from: ::1
[WebSocket] Request URL: /?token=XXX&agentId=XXX
[WebSocket] AgentId from URL: XXX
[WebSocket] Token received, length: XXX
```

Then either:
- ✅ `[WebSocket] ✅ Token verified successfully` - Good!
- ❌ `[WebSocket] ❌ Token verification failed` - JWT_SECRET mismatch

### 4. Common Issues and Solutions

#### Issue: Code 1006 (Abnormal Closure)
**Symptoms:** Connection closes immediately without proper close frame

**Possible Causes:**
1. **JWT_SECRET mismatch** - Most common
   - Check `.env` file has `JWT_SECRET` set
   - Ensure both Next.js and WebSocket server use the same secret
   - Restart both servers after changing `.env`

2. **Server not receiving connection**
   - Check if server is actually running: `netstat -ano | Select-String ":3001.*LISTENING"`
   - Check firewall isn't blocking port 3001

3. **Token expired or invalid**
   - Try logging out and logging back in to get a fresh token
   - Check browser console for token length (should be > 100 characters)

4. **Network/CORS issue**
   - Check browser console for CSP errors
   - Verify `ws://localhost:3001` is allowed in CSP (already fixed in `next.config.js`)

#### Issue: Code 1008 (Policy Violation)
**Symptoms:** Connection closes with code 1008

**Cause:** Authentication failure
- Token verification failed
- JWT_SECRET doesn't match
- Token missing required fields (userId, tenantId)

**Solution:**
- Check WebSocket server console for detailed error
- Verify JWT_SECRET matches between servers
- Check token is valid (not expired)

### 5. Step-by-Step Debugging

1. **Start WebSocket server:**
   ```bash
   npm run dev:websocket
   ```
   Look for: `[WebSocket] Server listening on port 3001`

2. **Open browser and navigate to the Demo page**

3. **Open browser DevTools Console** (F12)

4. **Try to connect** (click "Retry" or refresh page)

5. **Check browser console** for connection logs

6. **Check WebSocket server console** for server-side logs

7. **Compare the logs:**
   - If you see "New connection attempt" in server logs but not "Connected" in browser → Server is rejecting connection
   - If you don't see "New connection attempt" in server logs → Connection isn't reaching server
   - If you see "Token verification failed" → JWT_SECRET mismatch

### 6. Quick Fix: Ensure JWT_SECRET is Set

1. **Check if `.env` file exists in project root**

2. **Add or update JWT_SECRET:**
   ```bash
   JWT_SECRET=your-secret-key-here
   ```
   (Use the same secret that Next.js is using - since you're logged in, it must be configured somewhere)

3. **Restart both servers:**
   ```bash
   # Terminal 1
   npm run dev
   
   # Terminal 2
   npm run dev:websocket
   ```

4. **Try connecting again**

### 7. Verify Connection Flow

The connection should follow this flow:

1. **Client:** `[WebSocket] Attempting to connect...`
2. **Server:** `[WebSocket] New connection attempt...`
3. **Server:** `[WebSocket] Token received...`
4. **Server:** `[WebSocket] ✅ Token verified successfully...`
5. **Server:** `[WebSocket] ✅ Connection confirmed message sent`
6. **Client:** `[WebSocket] ✅ Connected successfully`
7. **Client:** `[WebSocket] Server ready` (receives 'connected' message)

If any step fails, check the logs to see where it stops.

## Next Steps

1. Check both browser console and WebSocket server console
2. Look for the detailed logs I added
3. Identify where the connection is failing
4. Apply the appropriate fix based on the error message

The enhanced logging should now show exactly what's happening at each step!
