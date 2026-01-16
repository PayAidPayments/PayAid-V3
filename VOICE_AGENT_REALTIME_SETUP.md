# 🚀 Real-time WebSocket Voice Streaming Setup

This guide explains how to set up and use real-time WebSocket-based voice streaming for voice agents.

## 📋 Prerequisites

1. **Install Dependencies**
   ```bash
   npm install ws @types/ws
   ```

2. **Environment Variables**
   Add to your `.env` file:
   ```env
   WEBSOCKET_PORT=3001
   NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:3001"
   JWT_SECRET="your-jwt-secret"  # Must match your Next.js JWT secret
   ```

## 🚀 Starting the WebSocket Server

### Option 1: Run Separately (Recommended for Development)

**Terminal 1 - Next.js Server:**
```bash
npm run dev
```

**Terminal 2 - WebSocket Server:**
```bash
npm run dev:websocket
```

### Option 2: Run Both Together

```bash
npm run dev:all
```

(Requires `concurrently` package: `npm install -D concurrently`)

## 🎯 How It Works

### Architecture

```
Browser (Client)
    ↓ WebSocket Connection
WebSocket Server (Port 3001)
    ↓ Processes Audio
Voice Agent Orchestrator
    ↓ STT → LLM → TTS
Response back via WebSocket
```

### Real-time Flow

1. **Client connects** to WebSocket server with JWT token
2. **Client sends** `start_call` message
3. **Server creates** call record and returns `callId`
4. **Client streams** audio chunks continuously (every 500ms)
5. **Server processes** each chunk:
   - Speech-to-Text (STT)
   - LLM generates response
   - Text-to-Speech (TTS)
6. **Server streams** back:
   - Transcript (as it's detected)
   - Response text
   - Audio response
7. **Client plays** audio automatically

## 🔧 Configuration

### WebSocket Server Port

Default: `3001`

Change in `.env`:
```env
WEBSOCKET_PORT=3001
```

### Client WebSocket URL

Default: `ws://localhost:3001`

Change in `.env`:
```env
NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:3001"
```

For production, use `wss://` (secure WebSocket):
```env
NEXT_PUBLIC_WEBSOCKET_URL="wss://your-domain.com"
```

## 🧪 Testing

1. **Start both servers:**
   ```bash
   npm run dev:all
   ```

2. **Navigate to demo page:**
   ```
   http://localhost:3000/voice-agents/{tenantId}/Demo?agentId={agentId}
   ```

3. **Enable real-time mode:**
   - Check the "Real-time WebSocket" checkbox
   - Wait for connection indicator to show "Real-time" (green)

4. **Start a call:**
   - Click "Start Real-time Call"
   - Click "Start Streaming"
   - Speak naturally - audio streams continuously

5. **Observe:**
   - Transcript appears as you speak
   - Response appears immediately
   - Audio plays automatically

## 🔍 Troubleshooting

### WebSocket Connection Failed

**Issue:** Connection indicator shows "Offline"

**Solutions:**
1. Ensure WebSocket server is running: `npm run dev:websocket`
2. Check port 3001 is not in use
3. Verify `NEXT_PUBLIC_WEBSOCKET_URL` in `.env`
4. Check browser console for errors

### Authentication Errors

**Issue:** "Authentication required" or "Invalid token"

**Solutions:**
1. Ensure `JWT_SECRET` matches in both servers
2. Verify token is valid and not expired
3. Check token is being sent correctly in WebSocket connection

### Audio Not Streaming

**Issue:** No audio chunks being sent

**Solutions:**
1. Check microphone permissions in browser
2. Verify MediaRecorder is working (check browser console)
3. Ensure call is active before streaming

### High Latency

**Issue:** Delays between speaking and response

**Solutions:**
1. Reduce audio chunk size (currently 500ms)
2. Optimize STT/TTS services
3. Use faster LLM model
4. Check network latency

## 📊 Performance

### Expected Latency

- **Audio streaming:** < 100ms (chunk transmission)
- **STT processing:** 500-1500ms (depends on service)
- **LLM response:** 1000-3000ms (depends on model)
- **TTS generation:** 500-2000ms (depends on service)
- **Total end-to-end:** 2-5 seconds (first response)
- **Subsequent responses:** 1-3 seconds (with conversation history)

### Optimization Tips

1. **Use streaming STT** (if available) for lower latency
2. **Use streaming TTS** (if available) for faster audio
3. **Cache agent configuration** to reduce DB queries
4. **Use connection pooling** for database
5. **Implement audio buffering** for smoother playback

## 🔒 Security

### Authentication

- All connections require valid JWT token
- Token is verified on connection
- Invalid tokens are rejected immediately

### Data Privacy

- Audio chunks are processed in memory
- No audio is stored permanently
- Transcripts are stored in database (as configured)
- Use HTTPS/WSS in production

## 🚀 Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start Next.js
pm2 start npm --name "nextjs" -- run start

# Start WebSocket server
pm2 start npm --name "websocket" -- run dev:websocket

# Save configuration
pm2 save
```

### Using Docker

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  nextjs:
    build: .
    ports:
      - "3000:3000"
    environment:
      - WEBSOCKET_URL=ws://websocket:3001
  
  websocket:
    build: .
    command: npm run dev:websocket
    ports:
      - "3001:3001"
    environment:
      - WEBSOCKET_PORT=3001
```

### Using Nginx (Reverse Proxy)

```nginx
# WebSocket proxy
location /ws {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 📚 API Reference

### WebSocket Message Types

**Client → Server:**
- `start_call` - Initialize a new call
- `audio` - Send audio chunk (base64)
- `end_call` - End the current call
- `ping` - Keep-alive heartbeat

**Server → Client:**
- `connected` - Connection established
- `call_started` - Call initialized (includes callId)
- `transcript` - Speech-to-text result
- `response` - LLM generated response
- `audio_response` - TTS audio (base64)
- `call_ended` - Call terminated
- `error` - Error message
- `pong` - Heartbeat response

## 🎉 Next Steps

- [ ] Implement streaming STT for lower latency
- [ ] Add streaming TTS for faster audio
- [ ] Implement voice activity detection (VAD)
- [ ] Add call recording
- [ ] Implement call analytics
- [ ] Add support for multiple concurrent calls

---

**Happy Real-time Voice Testing! 🎙️**

