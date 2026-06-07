# Voice Agent — Promoter Demo Runbook (Phase 2 exit)

Operator checklist for investor / promoter live demo. **Phase 2 only** — do not widen into Bolna telephony production cutover.

## Prerequisites

| Requirement | Check |
|-------------|-------|
| PostgreSQL reachable | `DATABASE_URL` / `DATABASE_DIRECT_URL` |
| Voice app (3003) | `npm run dev --workspace=voice` or deployed URL |
| Browser-live sidecar (3002) | `npm run dev:browser-live-ws:offline` |
| Sarvam TTS + STT | `SARVAM_API_KEY`, `BROWSER_LIVE_TTS_PROVIDER=sarvam`, `BROWSER_LIVE_STT_PROVIDER=sarvam` |
| Groq LLM | `GROQ_API_KEY` |
| CRM writeback | `BROWSER_LIVE_STUB=0`, `BROWSER_LIVE_PREFER_OFFLINE_REAL=0` |
| Auth token | `npm run voice-agent:mint-validation-auth-token` → `SMOKE_AUTH_TOKEN` |
| Optional Twilio outbound | `TWILIO_*`, `VOICE_OUTBOUND_TWIML_URL`, `VOICE_BASE_URL` |
| Optional in-call transfer | `VOICE_SUPERVISOR_PHONE`, agent `phoneNumber` |

### Sidecar env (PowerShell)

```powershell
$env:BROWSER_LIVE_STUB='0'
$env:BROWSER_LIVE_TTS_PROVIDER='sarvam'
$env:BROWSER_LIVE_STT_PROVIDER='sarvam'
$env:BROWSER_LIVE_PREFER_OFFLINE_REAL='0'
$env:VOICE_STT_LOW_CONFIDENCE_RAIL='1'
$env:VOICE_SUPERVISOR_PHONE='+919876543210'   # optional transfer demo
npm run dev:browser-live-ws:offline
```

## Automated rehearsal (one command)

```powershell
npm run voice-agent:mint-validation-auth-token
$env:SMOKE_AUTH_TOKEN='<token>'
$env:VOICE_SUPERVISOR_PHONE='+919876543210'   # required for escalation transfer.initiated
$env:VOICE_REHEARSAL_DIRECT='1'              # default: direct DB smokes (no voice HTTP)
npm run voice-agent:validate-promoter-demo-rehearsal
```

Covers: spoken E2E (1×), escalation spoken path, trigger queue, campaign dialer tick.

Set `VOICE_REHEARSAL_DIRECT=0` to use HTTP smokes (requires voice app on 3003 or deployed Vercel URL with `VERCEL_PROTECTION_BYPASS`).

**Deploy note:** `deploy:voice:git-archive` uses `git archive HEAD` — Phase 2 routes (`Monitor`, `triggers/*`, `supervisor/monitor`) must be **committed** before deploy or HTTP smokes return 404.

Evidence: `docs/evidence/voice-agent/2026-06-06-promoter-demo-rehearsal.md`

## Live demo script (10–12 min)

### 1. Spoken call + barge-in (3 min)

1. Open **Live Demo**: `/voice-agents/{tenantId}/LiveDemo?agentId={agentId}`
2. Enter a **new 10-digit caller phone** (unique per run for CRM lead).
3. Speak: *"Hello, I need help with my account."*
4. Confirm **agent audio** plays (Sarvam TTS).
5. **Barge-in**: interrupt mid-reply; confirm `interrupt.ack` / barge-in counter.
6. Say: *"Thanks, goodbye."* → end session.
7. Verify **post-call panel**: summary, sentiment, recording artifact, CRM routing (`unmatched_lead` or `matched_contact`).

### 2. Tool safety (1 min)

1. New session, same phone optional.
2. Say: *"Please send me a payment link for 500 rupees."*
3. Confirm **tool.draft** in browser console / network WS (draft-first — no charge executed).
4. Say: *"Schedule a callback tomorrow."* → **tool.executed** or queued callback tool.

### 3. Trigger + dialer (2 min)

1. `POST /api/v1/voice-agents/triggers/website-lead` (or Marketing form) with new phone.
2. Open **Supervisor Monitor**: `/voice-agents/{tenantId}/Monitor`
3. Confirm contact in **Outbound trigger queue**.
4. Click **Dial next** (or `POST …/campaigns/{id}/tick`).
5. Confirm contact moves to `calling` / stub `VoiceAgentCall` created.

### 4. Escalation + in-call transfer (2 min)

1. New Live Demo session.
2. Say: *"This is too expensive. Talk to my manager please."*
3. Confirm **transfer.initiated** (stub if no Twilio; Twilio conference if configured).
4. End session → post-call shows `escalation_request` + **escalation handoff** payload.
5. On Monitor: **Queue callback** → campaign contact queued; **Acknowledge** when handled.

### 5. Analytics wrap (1 min)

- `GET /api/v1/voice-agents/demo/analytics` — ended sessions, sentiment, objection tags.
- Monitor cards: escalations open, trigger queue depth.

## Smoke commands (individual)

```powershell
$env:SMOKE_AUTH_TOKEN='<token>'
npm run voice-agent:validate-spoken-e2e-repeat
npm run voice-agent:validate-spoken-server-stt-e2e-repeat
npm run smoke:voice-agent:trigger-webhooks
npm run smoke:voice-agent:campaign-dialer-tick
npm run voice-agent:smoke-supervisor-monitor-no-404
npm run voice-agent:smoke-live-demo-no-404
```

## Phase 2 completion criteria

- [x] Agent templates + post-call intelligence
- [x] Event-driven triggers + campaign dialer pickup
- [x] Supervisor monitor + escalation ack + callback transfer
- [x] In-call transfer (stub + Twilio conference when configured)
- [x] Browser-live draft-first tool safety wired in turn handler
- [x] Outbound Twilio status webhook → campaign contact completion

## Known blockers

| Blocker | Mitigation |
|---------|------------|
| DB unreachable | Sidecar falls back to `offlineReal` — no CRM writeback. Fix `DATABASE_URL`. |
| Jest slow / hangs | Use `--forceExit`; run targeted test files only. |
| Twilio live transfer | Requires `TWILIO_*`, agent `phoneNumber`, `VOICE_SUPERVISOR_PHONE`, public `VOICE_BASE_URL`. Demo works in **stub** mode without PSTN. |
| Vitest on Jest tests | Use `npx jest`, not `vitest`, for `__tests__/voice-agent/*`. |

## Evidence

After green rehearsal, save output to `docs/evidence/voice-agent/YYYY-MM-DD-promoter-demo-rehearsal.md`.
