# Promoter demo rehearsal — 2026-06-06 / 2026-06-07

## Environment

- Sidecar: `ws://127.0.0.1:3002` — restarted with operator env overrides
  - `BROWSER_LIVE_STUB=0`, `BROWSER_LIVE_OFFLINE_REAL=0`, `BROWSER_LIVE_PREFER_OFFLINE_REAL=0`
  - `BROWSER_LIVE_TTS_PROVIDER=sarvam`, `BROWSER_LIVE_STT_PROVIDER=sarvam`
  - `VOICE_SUPERVISOR_PHONE=+919876543210`
  - Health: `stubMode: false`, `offlineReal: false`
- Rehearsal mode: `VOICE_REHEARSAL_DIRECT=1` (direct DB smokes for trigger + dialer; no voice HTTP)
- Voice app: local Next dev still not required for direct rehearsal path

## Full green run — 2026-06-07T03:38–03:41 UTC

| Step | Result | Notes |
|------|--------|-------|
| `spoken-e2e-once` | **PASS** | Sarvam MP3, barge-in=1, CRM `unmatched_lead`, session `cmq38hexc000hl12ssv88wnih` |
| `escalation-spoken-once` | **PASS** | `transferMode: stub`, tags `price_objection` + `escalation_request`, session `cmq38hz84000nl12ssegy4xx0` |
| `trigger-queue` (direct) | **PASS** | website-lead, crm-stage, missed-call, marketing-facebook all queued |
| `campaign-dialer-tick` (direct) | **PASS** | stub dial `CA_STUB_4e26eb2cfbb53786dca6ddb0`, `call.started` event |
| `supervisor-monitor-no404` | **SKIPPED** | direct rehearsal mode (`VOICE_REHEARSAL_DIRECT=1`) |

```json
{"ok":true,"message":"Promoter demo rehearsal passed"}
```

## Commands used

```powershell
# Sidecar (shell env wins over .env.local after override:false fix)
$env:BROWSER_LIVE_STUB='0'
$env:BROWSER_LIVE_TTS_PROVIDER='sarvam'
$env:BROWSER_LIVE_STT_PROVIDER='sarvam'
$env:BROWSER_LIVE_PREFER_OFFLINE_REAL='0'
$env:BROWSER_LIVE_OFFLINE_REAL='0'
$env:VOICE_SUPERVISOR_PHONE='+919876543210'
npm run dev:browser-live-ws:offline

npm run voice-agent:mint-validation-auth-token
$env:SMOKE_AUTH_TOKEN='<token>'
$env:VOICE_REHEARSAL_DIRECT='1'
npm run voice-agent:validate-promoter-demo-rehearsal
```

## Fixes applied during rehearsal

1. **Sidecar dotenv** — `.env.local` loads with `override: false` so shell/cross-env operator overrides are not clobbered.
2. **Windows spawn** — rehearsal script uses `process.execPath` + `tsx/dist/cli.mjs` instead of `npx tsx` (spawnSync returned `status: null` on Windows).

## HTTP path — 2026-06-08 (full green on Vercel)

**Deployment:** `https://voice-rigcolz0o-payaid-projects-a67c6b27.vercel.app` (alias `voice-six-xi.vercel.app`)

| Check | Result | Notes |
|-------|--------|-------|
| Phase 2 routes committed + deploy | **DONE** | `git archive` includes Monitor, triggers, supervisor API |
| `smoke-trigger-webhooks` | **PASS** | 4/4 triggers queued (200) |
| `smoke-supervisor-monitor-no-404` | **PASS** | Monitor page 200 + supervisor API 200 |
| `smoke-live-demo-no-404` | **PASS** | LiveDemo shell 200 |
| `smoke-campaign-dialer-tick` | **PASS** | stub dial `dialed`, `callId` created |
| Local `:3003` | **BLOCKED** | Next dev/start still compile-hangs (use Vercel for HTTP) |

```powershell
npm run voice-agent:sync-stage1-vercel-env
npm run voice-agent:mint-validation-auth-token
$env:SMOKE_AUTH_TOKEN='<token>'
$env:VOICE_BASE_URL='https://voice-rigcolz0o-payaid-projects-a67c6b27.vercel.app'
$env:VERCEL_PROTECTION_BYPASS='<from .env.local>'
npm run smoke:voice-agent:trigger-webhooks
npm run voice-agent:smoke-supervisor-monitor-no-404
npm run smoke:voice-agent:campaign-dialer-tick
```

Spoken rehearsal (`VOICE_REHEARSAL_DIRECT=1`) still needs sidecar on `:3002`.

## Phase 2 status

Code checklist **100%**. Promoter rehearsal **full green** (direct + HTTP API smokes on Vercel).
