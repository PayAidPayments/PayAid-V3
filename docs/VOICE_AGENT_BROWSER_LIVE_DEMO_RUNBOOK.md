# Browser live voice demo (M1) — investor path

**Scope:** Browser-native speak-and-hear demo with interrupt. **Separate** from Browser demo v1 (typed chat).  
**Out of scope:** Twilio, GHCR, Bolna telephony, BrowserDemoV1 HTTP turn APIs.

## Architecture

| Layer | Location |
| --- | --- |
| UI | `/voice-agents/{tenantId}/LiveDemo?agentId=…` |
| Flag | `NEXT_PUBLIC_VOICE_BROWSER_LIVE_DEMO=1` |
| Sidecar | `npm run dev:browser-live-ws` → WSS port **3002** |
| Session DB | `VoiceDemoSession.channel = browser_live` |
| Turn brain | `lib/voice-agent/browser-live/turn-handler.ts` (Groq + TTS + training pack) |

Stage 1 text demo (`/Demo`, BrowserDemoV1) is **unchanged**.

## Local run (full stack)

### 1. Env (`.env.local`)

```env
NEXT_PUBLIC_VOICE_BROWSER_LIVE_DEMO=1
NEXT_PUBLIC_VOICE_LIVE_WS_URL=ws://localhost:3002
# or NEXT_PUBLIC_VOICE_LIVE_WS_PORT=3002

GROQ_API_KEY=…
DATABASE_URL=…
JWT_SECRET=…
JWT_SECRET must match voice app login token signing
```

Optional stub (no Groq):

```env
BROWSER_LIVE_STUB=1
```

### 2. Terminals

```bash
# Terminal A — voice Next app
npm run dev -w voice

# Terminal B — live voice WSS sidecar
npm run dev:browser-live-ws
```

Or one command:

```bash
npm run dev:voice-live-local
```

### 3. Open demo

1. Log in: `http://localhost:3003/login`
2. Live demo: `http://localhost:3003/voice-agents/{tenantId}/LiveDemo?agentId=va_stage1_bolna_smoke`
3. **Start live voice** → allow mic → speak → interrupt mid-response

## Staging / production

### Quick staging (no Render/Fly yet)

Keeps **voice-six-xi** live voice working via Cloudflare tunnel to your machine:

```bash
npm run voice-agent:start-browser-live-staging
# after tunnel URL prints, if it changed:
npm run voice-agent:start-browser-live-staging -- --wire
```

Investor URL (after login):  
`https://voice-six-xi.vercel.app/voice-agents/cmjptk2mw0000aocw31u48n64/LiveDemo?agentId=va_stage1_bolna_smoke`

Leave the staging terminal open during the demo.

### Permanent sidecar (Render)

- Deploy **sidecar** to always-on host (Fly/Docker — see `deployment/browser-live-ws/README.md`).
- Push Vercel public env and redeploy voice UI:

```bash
npm run voice-agent:push-browser-live-vercel-env
npm run deploy:voice:git-archive
```

- Set on Vercel voice project (or in `.env.local` before push):
  - `NEXT_PUBLIC_VOICE_BROWSER_LIVE_DEMO=1`
  - `NEXT_PUBLIC_VOICE_LIVE_WS_URL=wss://your-sidecar.example.com`
- Sidecar updates independently of voice UI redeploys.

## Investor demo checklist (~8 min)

- [ ] Badge **Live voice** + phase shows **Listening** after start
- [ ] Greeting utterance → agent text + audible reply (&lt; ~1.5s to first audio on good network)
- [ ] Payment / product question → coherent answer using agent config
- [ ] **Interrupt** mid sentence → audio stops immediately, returns to Listening
- [ ] Second turn after interrupt — no stuck “Thinking…”
- [ ] **Export latency JSON** downloads evidence file
- [ ] Do **not** mention phone/Twilio/Bolna in this track

## Latency checklist (internal)

Capture via **Export latency JSON** in UI or manual timestamps:

| Metric | Target | Max |
| --- | --- | --- |
| `speech_stopped` → `audio_first_byte` | &lt; 900 ms | 1.5 s |
| `interrupt` → `interrupt_silence` (client) | &lt; 100 ms | 150 ms |
| Full short reply | 2–4 s | 6 s |

Save exports under `docs/evidence/voice-agent/*-browser-live-latency.json`.

## Stub mode

`BROWSER_LIVE_STUB=1` on sidecar — echo-style text replies without Groq. Use for WSS/protocol testing.

## Transport (M1 → M2)

- **M1:** `WssLiveVoiceTransport` (`lib/voice-agent/browser-live/wss-live-voice-transport.ts`)
- **M2:** Implement `LiveVoiceTransport` with WebRTC; keep `BrowserLiveSessionStateMachine` unchanged.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| WebSocket connection failed | Start `npm run dev:browser-live-ws`; check URL/port |
| Invalid token | Re-login; same `JWT_SECRET` on sidecar |
| No speech recognition | Chrome/Edge desktop, HTTPS or localhost |
| No audio | Check TTS env; text reply may still appear |
| Live menu hidden | Set `NEXT_PUBLIC_VOICE_BROWSER_LIVE_DEMO=1` and rebuild |
