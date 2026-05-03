# Voice Agents Phase 1 – Twilio Inbound + CRM Sync

**Status:** Implemented

---

## 1. Inbound flow (no WebSocket)

When **`TELEPHONY_WEBSOCKET_URL`** is **not** set:

1. Caller dials the Twilio number.
2. **Webhook** `POST /api/v1/voice-agents/twilio/webhook` runs:
   - Finds agent by `To` (assigned phone number).
   - Creates a `VoiceAgentCall` (ringing).
   - Returns TwiML: **Say** greeting (from 3-tab workflow or description), then **Gather** (speech) with `action` = speech-handler.
3. Caller speaks → Twilio POSTs to **speech-handler** with `SpeechResult`.
4. **Speech-handler** `POST /api/v1/voice-agents/twilio/speech-handler`:
   - Loads call + agent, appends user message to conversation history (stored in `call.transcript`).
   - Calls **LLM** (Groq/Ollama) + **TTS** (VEXYL), caches audio by `callSid`.
   - Returns TwiML: **Play** (our playback URL) then **Gather** again (loop).
5. **Playback** `GET /api/v1/voice-agents/twilio/playback?callSid=...` returns cached WAV.
6. When the call ends, Twilio can send a **status callback** (GET same webhook with `CallStatus=completed`). We update the call record and run **CRM sync**.

When **`TELEPHONY_WEBSOCKET_URL`** **is** set, the webhook connects the call to that WebSocket stream instead (existing real-time path).

---

## 2. Twilio setup

1. **Buy a number** (Twilio console) and note the E.164 value (e.g. `+919876543210`).

2. **Assign to agent**  
   In **Studio** → Basics → **Twilio number (E.164)**, set that number and save. The webhook looks up the agent by this `To` value.

3. **Configure the number in Twilio**
   - **A call comes in** (Voice): `https://your-domain.com/api/v1/voice-agents/twilio/webhook`  
     Method: **POST**
   - **Status callback URL** (optional but recommended): same URL, Method: **GET**  
     So we receive `CallStatus=completed` and `CallDuration`, and run CRM sync.

4. **Env**
   - `TWILIO_AUTH_TOKEN` – used to verify webhook signature in production.
   - `TWILIO_WEBHOOK_URL` – optional; default is `request.nextUrl.origin + '/api/v1/voice-agents/twilio/webhook'`.

---

## 3. CRM sync on call end

When the status callback (GET) has **CallStatus=completed**:

- **Find or create Contact** by caller phone (`From`), tenant, and agent.
- **Log Interaction** (type `voice_call`, subject, notes from transcript snippet, duration) if workflow CRM “Log activity” is on.
- **Create Deal** (lead, linked to contact) if workflow CRM “Auto-create deal if interested” is on.

Workflow CRM flags come from the 3-tab **Studio** (or Create) → **CRM** tab: “Auto-create deal if interested”, “Log activity in contact timeline”.

---

## 4. Files

| Path | Purpose |
|------|--------|
| `app/api/v1/voice-agents/twilio/webhook/route.ts` | Inbound TwiML: greeting + Gather or WebSocket connect; GET = status callback + CRM sync |
| `app/api/v1/voice-agents/twilio/speech-handler/route.ts` | Handles Gather speech: LLM + TTS, cache, return Play + Gather |
| `app/api/v1/voice-agents/twilio/playback/route.ts` | Returns cached WAV for a callSid |
| `app/api/v1/voice-agents/twilio/connect-status/route.ts` | WebSocket stream status updates |
| `lib/voice-agent/playback-cache.ts` | In-memory callSid → audio buffer (TTL 5 min) |
| `lib/voice-agent/crm-sync.ts` | syncVoiceCallToCrm(callSid): Contact, Interaction, Deal |

---

## 5. Optional: WebSocket path

To use **real-time** streaming instead of Gather:

- Run your WebSocket server (e.g. port 3002).
- Set **`TELEPHONY_WEBSOCKET_URL`** to that server’s stream URL (e.g. `wss://your-host/voice/stream`).
- The webhook will use **Connect → Stream** to that URL instead of Gather + speech-handler.
