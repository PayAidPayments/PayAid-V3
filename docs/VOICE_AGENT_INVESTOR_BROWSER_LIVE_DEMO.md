# Voice Agents — Investor Browser-Live Demo (primary milestone)

**Status:** Active — telephony/PSTN **deferred until funding**  
**Scope:** Browser-live spoken demo only (no Twilio/Bolna PSTN in investor path)  
**Production URL:** https://voice-six-xi.vercel.app  
**Readiness command:** `npm run voice-agent:status-browser-live-investor`

---

## De-scoped (post-funding)

| Item | Status |
|------|--------|
| Twilio PSTN production matrix | **Deferred** |
| Bolna sidecar + Docker telephony gate | **Deferred** |
| Outbound campaign dialer live calls | **Deferred** (Monitor UI demo uses stub/queue only) |

---

## Languages (first investor demo)

| Tier | Codes | Use |
|------|-------|-----|
| **Primary** | `en`, `hi` | English + Hindi with natural code-switching |
| **Optional stretch** | `te` | Telugu — only if rehearsed same day on Sarvam STT/TTS |
| **Not in v1 demo** | `ta`, `kn`, `mr`, … | Post-funding multilingual expansion |

Set agent `language` in Studio; use **Calm & warm** tone, **Brief** verbosity, **Normal** pace for investor runs.

---

## Pre-demo checklist (30 min before)

```powershell
# 1. Sidecar (operator laptop or Render tunnel)
# Loads DATABASE_URL / JWT from .env.local via --env-file (required on Windows)
$env:BROWSER_LIVE_STUB='0'
$env:BROWSER_LIVE_TTS_PROVIDER='sarvam'
$env:BROWSER_LIVE_STT_PROVIDER='sarvam'
$env:BROWSER_LIVE_PREFER_OFFLINE_REAL='0'
$env:VOICE_GUARDRAILS='1'
$env:VOICE_STT_LOW_CONFIDENCE_RAIL='1'
npm run dev:browser-live-ws:offline

# 2. Readiness snapshot (WSS timeout default 120s for slow Supabase pooler)
# Optional: $env:BROWSER_LIVE_INVESTOR_WSS_MS='180000'
npm run voice-agent:status-browser-live-investor

# 3. Evidence rehearsal (optional, same day)
npm run voice-agent:mint-validation-auth-token
$env:SMOKE_AUTH_TOKEN='<token>'
npm run voice-agent:validate-spoken-e2e-repeat
```

**Vercel:** `NEXT_PUBLIC_VOICE_LIVE_WS_URL` must point to public WSS (tunnel or Render). Run `npm run voice-agent:wire-browser-live-production` if needed.

---

## Investor demo script (8 minutes)

**Audience:** Investors — prove India-first spoken AI + CRM + compliance, not phone infra.

### Setup (30 sec)

1. Open: `/voice-agents/{tenantId}/LiveDemo?agentId={agentId}`
2. Show **tone** (Calm & warm), **pace**, **verbosity** (Brief).
3. Enter a **fresh 10-digit phone** (ensures Voice Lead visibility).
4. Enable **CRM writeback** toggle.

### Act 1 — English qualification (2 min)

**You say:** *"Hello, I'm looking at PayAid for my small business. What can you help with?"*

**Show:** First spoken reply within ~2–4 s (Sarvam TTS audio).  
**Narrate:** Low-latency browser-live, not a chat widget.

**You say:** *"We have about twenty employees and need CRM plus billing."*

**Show:** Short, natural reply (1–2 sentences).

### Act 2 — Code-switch / Hindi (2 min)

**You say:** *"Ji, Hindi mein bataiye — pricing kya hai?"*

**Show:** Agent responds in Hindi-English mix (code-switch).  
**Narrate:** Sarvam STT/TTS tuned for Indian accents and Hinglish.

### Act 3 — Barge-in (1 min)

Interrupt mid-reply.  
**Show:** Audio stops; next reply reflects your interruption (barge-in counter in devtools / session metadata).  
**Narrate:** Natural turn-taking, not monologue playback.

### Act 4 — Compliance + security (1 min)

Open **Compliance** tab in sidebar (or mention policy).  
**Narrate:** Tenant recording/transcript policy, consent audit trail, guardrails on input/output (no payment execution without draft-first).

**Optional line:** *"Please send a payment link for five hundred rupees."*  
**Show:** Tool **draft** only — no charge executed.

### Act 5 — Post-call artifacts + CRM (2 min)

End session.  
**Show post-call panel:**

| Artifact | What to point at |
|----------|------------------|
| Transcript | Timestamped turns |
| Summary + disposition | AI post-call intelligence |
| Recording | Session audio artifact |
| CRM routing | `Voice Lead (Unverified)` or matched contact |
| Compliance | Consent captured in audit trail |

Open CRM **Contact** or **Voice Inbox** if time permits.

### Close (30 sec)

*"This is browser-live today; PSTN telephony is on the roadmap after funding — same runtime, same CRM, same compliance layer."*

---

## Readiness dimensions

| Dimension | Target | Verify |
|-----------|--------|--------|
| First-turn latency | p50 &lt; 4 s spoken | Sidecar + Sarvam; `voice-agent:evidence-browser-live-real` |
| Barge-in | Interrupt stops audio; next turn coherent | Live interrupt during Act 3 |
| Transcript | Turns + timestamps persisted | Post-call panel |
| Summary | Disposition + summary visible | Post-call panel |
| CRM writeback | Voice Lead or matched contact | CRM / artifacts `crmIds` |
| Compliance | Policy UI + consent audit | `/Compliance`, session metadata |
| Security | Input/output guardrails + draft-first tools | `VOICE_GUARDRAILS=1`, payment link demo |
| Replay evidence | 3× E2E green | `docs/evidence/voice-agent/2026-06-06-spoken-e2e-3x.md` |

---

## Remaining blockers (typical)

| Blocker | Mitigation |
|---------|------------|
| Sidecar not running | `npm run dev:browser-live-ws:offline` or Render deploy |
| No public WSS on Vercel | Tunnel (`voice-agent:tunnel-browser-live-ws`) or Render WSS URL |
| `GROQ_API_KEY` missing | Set on sidecar host |
| `SARVAM_API_KEY` missing / TTS flaky | Text-first fallback; fix keys before investor day |
| Stale Vercel deploy | Redeploy voice; smokes on LiveDemo |
| Mic permissions | HTTPS + user gesture on LiveDemo |
| Supabase pooler slow/unreachable | `session.start` may exceed 120s; retry or use stable network; verify `DATABASE_URL` pooler |

---

## Related

- [`VOICE_AGENT_PROMOTER_DEMO_RUNBOOK.md`](./VOICE_AGENT_PROMOTER_DEMO_RUNBOOK.md) — full Phase 2 (includes triggers; skip for pure investor path)
- [`VOICE_AGENT_SECURITY_ROADMAP.md`](./VOICE_AGENT_SECURITY_ROADMAP.md) — browser-live guardrails
- [`VOICE_AGENT_SPOKEN_PROVIDER_POLICY.md`](./VOICE_AGENT_SPOKEN_PROVIDER_POLICY.md) — Sarvam-first
