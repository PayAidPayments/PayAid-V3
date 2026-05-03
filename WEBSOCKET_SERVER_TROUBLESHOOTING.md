# WebSocket Server Troubleshooting Guide

## ✅ **WebSocket Server Status**

**Current Status:** ✅ **Server is Running**

The WebSocket server is currently running on port 3001 (Process ID: 9776).

---

## 🔍 **Connection Issues Diagnosis**

If you're seeing connection errors, check the following:

### 1. **Verify Server is Running**

```powershell
# Check if server is listening on port 3001
netstat -ano | Select-String ":3001"

# Should show:
# TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING       9776
```

### 2. **Check Environment Variables**

Ensure your `.env` file has:

```env
WEBSOCKET_PORT=3001
NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:3001"
JWT_SECRET="your-jwt-secret"  # Must match Next.js JWT secret
```

### 3. **Verify JWT Token**

The WebSocket connection requires a valid JWT token. Check:

- ✅ User is logged in
- ✅ Token is valid and not expired
- ✅ Token is being sent in the connection URL

### 4. **Check Browser Console**

Look for detailed error messages:
- `[WebSocket] Connection error:` - Shows connection issues
- `[WebSocket] Disconnected` - Shows disconnection details
- `[WebSocket] ✅ Connected successfully` - Confirms successful connection

---

## 🛠️ **Common Issues & Solutions**

### Issue: "WebSocket server not running"

**Symptoms:**
- Error code: 1006 or 1002
- Connection refused error

**Solution:**
```bash
# Start WebSocket server
npm run dev:websocket

# Or start both servers together
npm run dev:all
```

### Issue: "Connection closed immediately"

**Possible Causes:**
1. **Invalid JWT Token**
   - Token expired or invalid
   - Token not matching JWT_SECRET

2. **Authentication Failed**
   - User not authenticated
   - Token verification failed on server

**Solution:**
- Log out and log back in to get a fresh token
- Check that `JWT_SECRET` matches in both Next.js and WebSocket server

### Issue: "Connection timeout"

**Possible Causes:**
- Firewall blocking port 3001
- Network connectivity issues
- Server overloaded

**Solution:**
- Check firewall settings
- Verify port 3001 is accessible
- Check server logs for errors

---

## 🔧 **Manual Testing**

### Test WebSocket Connection

1. **Open Browser Console** (F12)
2. **Navigate to voice agent page**
3. **Check console logs:**
   ```
   [WebSocket] Attempting to connect to ws://localhost:3001
   [WebSocket] ✅ Connected successfully
   ```

### Test with WebSocket Client

```javascript
// In browser console
const ws = new WebSocket('ws://localhost:3001?token=YOUR_TOKEN&agentId=YOUR_AGENT_ID')

ws.onopen = () => console.log('Connected!')
ws.onerror = (error) => console.error('Error:', error)
ws.onclose = (event) => console.log('Closed:', event.code, event.reason)
```

---

## 📊 **Connection States**

The WebSocket hook provides connection state:

```typescript
const { isConnected, isCallActive, callId } = useVoiceWebSocket({
  agentId: 'agent-123',
  token: 'jwt-token',
  enabled: true,
  onError: (error) => console.error('WebSocket error:', error),
})
```

**States:**
- `isConnected: false` - Not connected (check server)
- `isConnected: true` - Connected and ready
- `isCallActive: true` - Active call in progress

---

## 🚀 **Quick Fixes**

### Fix 1: Restart WebSocket Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev:websocket
```

### Fix 2: Restart Both Servers

```bash
# Stop all Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Start both
npm run dev:all
```

### Fix 3: Check Port Availability

```powershell
# Check if port 3001 is in use
netstat -ano | Select-String ":3001"

# If another process is using it, stop it or change WEBSOCKET_PORT
```

---

## ✅ **Verification Checklist**

- [ ] WebSocket server process is running
- [ ] Port 3001 is listening
- [ ] Environment variables are set correctly
- [ ] JWT_SECRET matches in both servers
- [ ] User is logged in (has valid token)
- [ ] Browser console shows connection attempts
- [ ] No firewall blocking port 3001
- [ ] Network connectivity is working

---

## 📝 **Server Logs**

Check WebSocket server logs for:
- `✅ Voice WebSocket Server running on ws://localhost:3001`
- `[WebSocket] New connection attempt`
- `[WebSocket] Connection authenticated`
- Any error messages

---

## 🆘 **Still Having Issues?**

1. **Check server logs** - Look for authentication errors
2. **Verify token** - Ensure JWT token is valid
3. **Test connection** - Use browser console WebSocket test
4. **Check network** - Verify localhost connectivity
5. **Restart servers** - Stop and restart both Next.js and WebSocket servers

---

**Current Status:** Server is running. If you see connection errors, it's likely an authentication or token issue. Check the browser console for detailed error messages.
