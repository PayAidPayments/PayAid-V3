# VEXYL Voice Gateway + PayAid (Self-Hosted, Low Cost)

Run the [VEXYL AI Voice Gateway](https://vexyl.ai/docs/installation.html) in Docker and use PayAid as the **Custom LLM**. STT and TTS are handled by VEXYL; PayAid only returns text replies. This keeps the pipeline self-hosted and minimizes cost (Groq free tier for STT, your Groq/Ollama for LLM, Gemini free tier for TTS).

---

## 1. Architecture

| Step | Where | Provider |
|------|--------|----------|
| STT  | VEXYL  | **Groq Whisper** (free tier) |
| LLM  | **PayAid** | Your Groq / Ollama (already in `.env`) |
| TTS  | VEXYL  | **Gemini** (free tier) or Sarvam |

- **Standard mode** (`GATEWAY_MODE=false`): full pipeline STT → LLM → TTS.
- **Ports**: 8080 (AudioSocket), 8081 (HTTP), 8082 (WebSocket).

---

## 2. Environment Variables

Add or ensure these in `.env` (used by both Next.js and Docker Compose):

```bash
# Required for VEXYL STT (Groq Whisper)
GROQ_API_KEY=your_groq_key

# Required for VEXYL TTS when using Gemini (free tier)
GEMINI_API_KEY=your_gemini_key

# PayAid URL reachable from the VEXYL container (LLM webhook)
# Windows/Mac Docker: host.docker.internal
# Linux: use your host IP (e.g. 172.17.0.1) or run with network_mode: host
VEXYL_LLM_WEBHOOK_URL=http://host.docker.internal:3000/api/voice/vexyl-llm

# Optional: TTS provider for VEXYL (gemini | sarvam)
# VEXYL_TTS_PROVIDER=gemini
```

If you prefer **Sarvam TTS** (Indian languages), set `VEXYL_TTS_PROVIDER=sarvam` and `SARVAM_API_KEY` in `.env`, and in `docker-compose.vexyl.yml` uncomment the Sarvam env and ensure `TTS_PROVIDER` uses it.

---

## 3. Run VEXYL in Docker

From the project root:

```bash
docker compose -f docker-compose.vexyl.yml up -d
```

Check health:

```bash
curl http://localhost:8081/health
```

Logs:

```bash
docker compose -f docker-compose.vexyl.yml logs -f vexyl-voice-gateway
```

---

## 4. Point PayAid at VEXYL

### 4.1 Asterisk (AudioSocket)

VEXYL receives audio from Asterisk on port **8080**. Example dialplan ([VEXYL Asterisk docs](https://vexyl.ai/docs/asterisk.html)):

```ini
[voice-assistant]
exten => 100,1,Answer()
exten => 100,n,Set(SESSION_UUID=${UNIQUEID})
; Send metadata so PayAid knows which agent to use (use your Voice Agent ID)
exten => 100,n,Set(CURL_RESULT=${CURL(http://127.0.0.1:8081/session/${SESSION_UUID}/metadata,callerid=${CALLERID(num)}&agentId=YOUR_VOICE_AGENT_ID)})
exten => 100,n,AudioSocket(${SESSION_UUID},127.0.0.1:8080)
exten => 100,n,Hangup()
```

Replace `YOUR_VOICE_AGENT_ID` with the PayAid Voice Agent ID (UUID from the Voice Agents dashboard).

### 4.2 Browser (WebSocket SDK)

For the [VEXYL Browser SDK](https://vexyl.ai/docs/websocket.html), connect to:

- **URL:** `ws://localhost:8082` (or your server and port)
- Set `WEBSOCKET_AUDIO_ALLOWED_ORIGINS` in the compose file to your app origin (e.g. `http://localhost:3000`).

The SDK does not send `agentId` by default; you’d need to pass it via session metadata if your deployment supports it, or use a single default agent.

### 4.3 Outbound / dynamic bot

For [outbound calls](https://vexyl.ai/docs/outbound.html), when initiating the call include `metadata.agentId` (or `metadata.botId`) so the webhook knows which PayAid agent to use:

```json
{
  "phoneNumber": "+919876543210",
  "metadata": {
    "agentId": "your-voice-agent-uuid",
    "llm_context": "Payment reminder call. Due: 2024-12-05."
  }
}
```

---

## 5. PayAid Webhook (Custom LLM)

VEXYL sends POST requests to:

`VEXYL_LLM_WEBHOOK_URL` → default: `http://host.docker.internal:3000/api/voice/vexyl-llm`

**Request body (from VEXYL):**

- `message` – user’s transcribed text  
- `sessionId` – call/session ID  
- `context` – optional: `callerName`, `phone`, **`agentId`** or **`botId`** (required for correct agent)

**Response:**

- `response` – text for TTS  
- `metadata.shouldHangup` – optional, to end the call

The route uses `context.agentId` or `context.botId` to select the PayAid Voice Agent and keeps per-session conversation history.

---

## 6. Linux: Making PayAid reachable from the container

On Linux, `host.docker.internal` may not exist. Options:

1. **Set host IP explicitly:**

   ```bash
   # e.g. host IP on Docker bridge
   export VEXYL_LLM_WEBHOOK_URL=http://172.17.0.1:3000/api/voice/vexyl-llm
   docker compose -f docker-compose.vexyl.yml up -d
   ```

2. **Or add to the compose service:**

   ```yaml
   extra_hosts:
     - "host.docker.internal:host-gateway"
   ```

   and keep `VEXYL_LLM_WEBHOOK_URL=http://host.docker.internal:3000/api/voice/vexyl-llm`.

---

## 7. Troubleshooting

- **Gateway not starting:** Check ports 8080/8081/8082 are free: `netstat -tlnp | grep -E '8080|8081|8082'` (or equivalent on Windows).
- **No reply from assistant:** Ensure PayAid is running and reachable at `VEXYL_LLM_WEBHOOK_URL`; check Next.js logs for `[VEXYL LLM]`.
- **Wrong or no agent:** Ensure Asterisk/outbound sends `agentId` (or `botId`) in session metadata or in the outbound `metadata` object.
- **TTS fails:** If using Gemini, ensure `GEMINI_API_KEY` is set in `.env` and passed into the container. For Sarvam, set `VEXYL_TTS_PROVIDER=sarvam` and `SARVAM_API_KEY`.

See also [VEXYL Troubleshooting](https://vexyl.ai/docs/troubleshooting.html).
