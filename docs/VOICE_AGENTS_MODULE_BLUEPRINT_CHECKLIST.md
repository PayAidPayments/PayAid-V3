# Voice Agents Module — Blueprint Execution Checklist

**Source blueprint:** [`voice_agents_module_blueprint.md`](../voice_agents_module_blueprint.md)  
**How to use:** Check items as they ship. Add a dated note in **Update log** at the bottom.  
**Scoring:** `Done = 1.0`, `Partial = 0.5`, `Missing = 0.0`  
**Related tracks:** Bolna sidecar checklist in [`PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md`](./PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md) (Active Track — Voice Agents real-time runtime)

**Last refreshed:** 2026-06-03

---

## Immediate decisions (blueprint §Immediate decisions)

| # | Decision | Status | Resolution |
|---|----------|--------|------------|
| 1 | Sarvam as primary spoken provider (demo + near-term prod) | **Approved** | `BROWSER_LIVE_TTS_PROVIDER=sarvam`; Bolna `buildBolnaAgent()` Sarvam-first for hi/ta/te |
| 2 | First demo use case | **Approved** | Browser-live inbound spoken demo (sales/qualification); telephony deferred to Stage 2 gate |
| 3 | Unmatched caller CRM rule | **Approved** | Create **Voice Lead (Unverified)** — `source: voice_agent`, `sourceData.verificationStatus: pending` |
| 4 | Mandatory recording + transcript + consent per tenant | **Partial** | Tenant policy UI + API (`/Compliance`, `GET/PUT /compliance/policy`); runtime enforcement on closeout/export |
| 5 | First launch tier | **Approved** | **Tier 1 Essentials** + spoken demo gates from Phase 1 only |

---

## Phase 1 — Spoken demo path (target: 1–2 weeks)

### 1.1 Provider stack (Sarvam-first)

- [x] Sarvam TTS wired for browser-live (`lib/voice-agent/tts.ts`, `browser-live/tts-stream.ts`)
- [x] Sarvam TTS health probe (`/health/tts`, `probeTtsHealth()`)
- [x] Sarvam STT for browser-live server path (`sarvam.ts` + `browser-live/server-stt.ts`, `BROWSER_LIVE_STT_PROVIDER`)
- [x] Document Bhashini as paused; codify failover order in `docs/VOICE_AGENT_SPOKEN_PROVIDER_POLICY.md`
- [x] `.env.local`: `BROWSER_LIVE_TTS_PROVIDER=sarvam`, `BROWSER_LIVE_PREFER_OFFLINE_REAL=0`

### 1.2 Realtime gateway (browser-live sidecar)

- [x] `agent.audio.chunk` streaming (`server/browser-live-voice-ws.ts`)
- [x] Barge-in: `interrupt` → `interrupt.ack` + turn cancel
- [x] Session recording upload on `session.end`
- [x] Transcript persistence (`VoiceDemoSession.transcriptJson`)
- [x] Post-call artifacts (`finalizeBrowserLiveSession`, `session.ended`)
- [x] Sidecar uses standalone Prisma (`server/db-prisma.ts`) with training-pack guards
- [x] **Runtime gate:** `npm run voice-agent:validate-spoken-e2e-repeat` — **3 consecutive passes** (`docs/evidence/voice-agent/2026-06-06-spoken-e2e-3x.md`)

### 1.3 Demo UI

- [x] Tone/persona selector (`BrowserLiveVoiceDemo.tsx`)
- [x] Pace selector
- [x] Caller phone + CRM writeback toggle
- [x] Post-call artifacts panel (routing, disposition, summary, entities, CRM ids)
- [x] Fix missing refs (`phaseWatchdog`, `connectionNote`, `offlineReal`, etc.)

### 1.4 CRM routing (matched / unmatched / no-CRM inbox)

- [x] Routing rules (`transcript-routing.ts`): `matched_contact` \| `unmatched_lead` \| `no_crm_inbox`
- [x] Unit tests (`__tests__/voice-agent/transcript-routing.test.ts`)
- [x] **Voice Lead (Unverified)** object semantics on unmatched create (`lib/voice-agent/crm-voice-lead.ts`, `crm-writeback.ts`)
- [x] Matched contact → `Interaction` (`post-call-pipeline.ts`, `crm-writeback.ts`)
- [x] No-CRM → inbox-only flag in artifacts (no DB writes)
- [x] Telephony path parity (`lib/voice-agent/crm-sync.ts` uses Voice Lead (Unverified))

### 1.5 Demo acceptance (blueprint §Demo acceptance checklist)

| Criterion | Status | Evidence / blocker |
|-----------|--------|-------------------|
| Spoken audio (repeatable, chosen languages) | **Pass** | Sarvam `audio/mpeg` chunks; 3× green 2026-06-06 |
| Barge-in | **Pass** | `interrupt.ack` + `barge_in.detected` event; 3× runs |
| Recording | **Pass** (demo) | `postCall.recording` in all 3 runs |
| Transcript (timestamps + turns) | **Pass** (demo) | 4 turns/run in `transcriptJson` |
| CRM writeback | **Pass** (demo) | Voice Lead (Unverified) + `crm.match.failed` event |
| Analytics (disposition + summary in UI) | **Pass** | Demo artifacts + `GET /unified-analytics` (telephony + browser-live) |

### 1.6 Phase 1 exit gate

- [x] All six demo acceptance rows **Pass** (demo path; telephony parity separate)
- [x] `voice-agent:validate-spoken-e2e-repeat` green × 3
- [x] Evidence file: `docs/evidence/voice-agent/2026-06-06-spoken-e2e-3x.md`
- [x] No-404 QA on LiveDemo route (`npm run voice-agent:smoke-live-demo-no-404`)
- [x] Code Review on post-call + routing diff (`docs/evidence/voice-agent/2026-06-06-post-call-routing-code-review.md`)
- [x] Server STT 3× E2E (`npm run voice-agent:validate-spoken-server-stt-e2e-repeat`) — `docs/evidence/voice-agent/2026-06-06-spoken-server-stt-e2e-3x.md`

**Phase 1 completion:** **100%** (spoken demo exit gate + server STT path + code review)

---

## Phase 2 — Product hardening (target: 2–4 weeks)

### 2.1 Agent templates

- [x] Template library: inbound support, sales qualification, appointment booking, reminders, collections (`lib/voice-agent/agent-templates.ts`, Studio create picker)
- [x] Purpose-based tone defaults on create (`voice-behavior-config.ts`, `VoiceCreateAgentWorkspace.tsx`)
- [x] Campaign types UI (`VoiceCampaignsWorkspace.tsx`)
- [x] Training pack shape (`training-pack-types.ts`)

### 2.2 Post-call intelligence

- [x] Summary + disposition inference (`post-call-pipeline.ts`)
- [x] Entity extraction (phones, emails)
- [x] Sentiment on post-call path (`post-call-intelligence.ts` → `post-call-pipeline.ts`, demo UI)
- [x] Objection tagging on post-call path (`extractObjectionTags`)
- [x] Follow-up CRM task creation from objection tags (`crm-follow-up-tasks.ts`)
- [x] Demo QA analytics API (`GET /api/v1/voice-agents/demo/analytics`)

### 2.3 Event-driven triggers

- [x] Event taxonomy module (`lib/voice-agent/events/voice-event-taxonomy.ts`, `emit-voice-event.ts`)
- [x] Browser-live event bridge (`lib/voice-agent/browser-live/voice-event-bridge.ts`)
- [x] `lead.triggered.call` from website form webhook (`POST /api/v1/voice-agents/triggers/website-lead`)
- [x] CRM stage triggers (`new_lead`, `renewal_due`, `invoice_overdue`) — `POST …/triggers/crm-stage`
- [x] Missed-call callback trigger — `POST …/triggers/missed-call`
- [x] Marketing lead webhooks (Facebook / LinkedIn) — `POST …/triggers/marketing-lead`

### 2.4 Human transfer + safety

- [x] `escalation.requested` event (post-call when `escalation_request` objection tag)
- [x] Escalation context payload (`escalation-handoff.ts` + post-call artifacts)
- [x] Supervisor monitor UI (`/voice-agents/{tenantId}/Monitor`, `GET …/supervisor/monitor`)
- [x] Escalation acknowledge API (`POST …/escalations/{sessionId}/ack`)
- [x] Escalation callback transfer (`POST …/escalations/{sessionId}/transfer` → campaign dialer)
- [x] In-call PSTN transfer (`in-call-transfer.ts`, `transfer.initiated` WS, `POST …/sessions/{id}/transfer`, Twilio conference TwiML)
- [x] Low-confidence STT safety rail (`VOICE_STT_LOW_CONFIDENCE_RAIL=1`, `stt-safety.ts`)
- [x] Browser-live draft-first tool safety wired in turn handler (`turn-tools.ts` → `tool.draft` / `tool.executed`)

### 2.5 Campaign dialer pickup

- [x] Sequential dialer core (`campaign-dialer.ts`, `outbound-dial.ts` stub + Twilio)
- [x] Campaign tick API (`POST …/campaigns/[id]/tick`, `POST …/campaigns/tick`)
- [x] Outbound status webhook (`POST …/runtime/twilio/status` → `campaign-call-completion.ts`)
- [x] Supervisor monitor dial controls + smoke (`smoke-campaign-dialer-tick.mjs`)
- [x] Promoter demo runbook + rehearsal (`docs/VOICE_AGENT_PROMOTER_DEMO_RUNBOOK.md`, `voice-agent:validate-promoter-demo-rehearsal`)

**Phase 2 completion:** 100%

---

## Phase 3 — Platform productization (target: 4–8 weeks)

### 3.1 Entitlements + RBAC + audit

- [x] `voiceRealTime` / standalone Voice Agents entitlement SKU (`lib/voice-agent/entitlements.ts`, `requireVoiceRealtimeAccess`, UI filter for `voice-realtime`)
- [x] Module alias `voice-agents → ai-studio` (`module-license-filter.ts`)
- [x] Voice-specific RBAC (configure vs operate vs listen-only) — `lib/voice-agent/rbac.ts`, `requireVoiceAccess`, role defaults in `lib/rbac.ts`
- [x] Compliance audit trail (consent, retention, redaction) — `compliance-audit.ts`, `AuditLog` + session `complianceAudit`, `GET /compliance/audit`, inbox export `?redact=1`

### 3.2 Data model (blueprint §CRM schema)

| Entity | Status | Prisma / notes |
|--------|--------|----------------|
| VoiceAgent | **Done** | `VoiceAgent` |
| VoiceCampaign | **Partial** | `VoiceAgentCampaign` — `triggerSource` + `businessHoursJson`; dialer enforces hours |
| VoiceCall | **Done** | `VoiceAgentCall` |
| VoiceTurn | **Done** | `CallMessage.interruptedFlag` + `transcriptJson.interruptedFlag` via barge-in (`session-metrics.ts`) |
| VoiceOutcome | **Partial** | `outcomeCode` + `metadataJson.postCall` |
| VoiceArtifact | **Partial** | `recordingUrl` + embedded postCall recording |
| CRMLink | **Done** | `VoiceCrmLink` + `linkVoiceSessionCrmOutcome`; `GET /crm-links` |

### 3.3 Standalone module inbox

- [x] `no_crm_inbox` routing flag
- [x] Dedicated Voice Inbox UI (queue for unmatched / non-CRM tenants) — `/Inbox`, `loadVoiceInbox`, `VoiceInboxWorkspace`
- [x] Webhook/API export for inbox items — `GET /api/v1/voice-agents/inbox/export`

### 3.4 Cross-module bundles

- [x] CRM writeback (Interaction + Contact)
- [x] Marketing hot-lead dialer integration — `hotLeadScore` gate on marketing-lead trigger (`VOICE_MARKETING_HOT_LEAD_MIN_SCORE`)
- [x] Support case update path — `applySupportCaseBundle` (case link + interaction notes)
- [x] Finance collections / promise-to-pay path — `applyFinanceCollectionsBundle` (invoice metadata + CRM link)

- [x] Unified telephony + browser-live analytics — `unified-voice-analytics.ts`, `GET /unified-analytics`, Analytics UI cross-channel cards
- [x] Tenant consent policy UI — `VoiceTenantCompliancePolicy`, `/Compliance`, `GET/PUT /compliance/policy`
- [x] Dedicated `VoiceEvent` table — dual-write from `persist-voice-event.ts`, `GET /events`

**Phase 3 completion:** ~85%

---

## Event taxonomy (blueprint §Event routing)

| Event | Status | Implementation |
|-------|--------|----------------|
| `call.started` | **Partial** | Emitted from sidecar on `session.ready`; Bolna `call_started` |
| `transcript.partial` | Partial | Client Web Speech only; Bolna received not persisted |
| `barge_in.detected` | **Partial** | Emitted from sidecar on `interrupt.ack`; Bolna `barge_in` on `VoiceAgentCall` |
| `call.completed` | **Partial** | Emitted from sidecar on `session.ended`; Bolna `call_ended` |
| `summary.ready` | **Partial** | Emitted in `finalizeBrowserLiveSession` + `crm-sync.ts` |
| `crm.match.failed` | **Partial** | Emitted on unmatched lead create (browser-live + telephony) |
| `lead.triggered.call` | **Partial** | Website + marketing lead trigger routes |
| `crm.stage.triggered` | **Partial** | `triggers/crm-stage-trigger.ts` + API route |
| `missed_call.callback` | **Partial** | `triggers/missed-call-trigger.ts` + API route |
| `escalation.requested` | **Partial** | Post-call + handoff payload in event meta |

- [x] Shared emitter: `lib/voice-agent/events/emit-voice-event.ts` (structured console log; `VOICE_EVENT_LOG=1`)
- [x] Persist events to `VoiceDemoSession.metadataJson.voiceEvents` + `VoiceEvent` table (`persist-voice-event.ts`, `GET /events`)

---

## Runtime operator runbook (Phase 1 unblock)

```powershell
# Prisma client (must expose voiceDemoSession)
cd "D:\Cursor Projects\PayAid V3\packages\db"
npx prisma generate

# Sidecar
$env:BROWSER_LIVE_STUB='0'
$env:BROWSER_LIVE_TTS_PROVIDER='sarvam'
$env:BROWSER_LIVE_PREFER_OFFLINE_REAL='0'
npm run dev:browser-live-ws:offline

# Token + 3× validation
npm run voice-agent:mint-validation-auth-token
$env:SMOKE_AUTH_TOKEN='<token>'
npm run voice-agent:validate-spoken-e2e-repeat
```

---

## Update log

| Date | Change |
|------|--------|
| 2026-06-05 | Created blueprint execution checklist from `voice_agents_module_blueprint.md`. Mapped Phase 1 spoken demo (~65%), Phase 2 (~30%), Phase 3 (~25%). Phase 1 exit blocked on 3× E2E + Voice Lead (Unverified) semantics. |
| 2026-06-05 | Wired Voice Lead (Unverified) via `crm-voice-lead.ts` + `crm-writeback.ts` into browser-live post-call and telephony `crm-sync.ts`. Added voice event bridge + emitter hooks (`call.started`, `barge_in.detected`, `call.completed`, `summary.ready`, `crm.match.failed`). Tests: `crm-voice-lead.test.ts`, `voice-event-taxonomy.test.ts`. Phase 1 ~72%; exit still blocked on 3× E2E (Prisma/DB). |
| 2026-06-06 | **Phase 1 spoken exit gate GREEN** — `validate-spoken-e2e-repeat` passed 3×. Fixed `Contact.sourceId` FK on voice leads. Added sidecar DB retry + pooler URL hardening. Evidence: `docs/evidence/voice-agent/2026-06-06-spoken-e2e-3x.md`. Phase 1 ~85%. |
| 2026-06-03 | Closed Phase 1 gaps: Sarvam STT (`sarvamStt` + `server-stt.ts`), `docs/VOICE_AGENT_SPOKEN_PROVIDER_POLICY.md`, LiveDemo No-404 smoke (`voice-agent:smoke-live-demo-no-404`), unit tests `browser-live-server-stt.test.ts`. Phase 1 ~95%. |
| 2026-06-06 | **Server STT 3× E2E GREEN** — `validate-spoken-server-stt-e2e-repeat` (`utterance.audio` → Sarvam STT). Code review approved. Phase 1 **100%**. |
| 2026-06-06 | **Phase 2 foundations** — Agent template library + Studio picker; post-call sentiment + objection tags; voice event persistence on `VoiceDemoSession`. Phase 2 ~45%. |
| 2026-06-06 | **Phase 2 triggers + tasks** — Website lead webhook (`lead.triggered.call`); CRM follow-up tasks from objections; `escalation.requested` event; demo QA analytics API. Phase 2 ~58%. |
| 2026-06-06 | **Phase 2 trigger webhooks complete** — CRM stage, missed-call, marketing lead routes; shared `campaign-queue.ts`; `VOICE_AGENT_TRIGGERS_RUNBOOK.md`; escalation handoff payload. Phase 2 ~72%. |
| 2026-06-06 | **Supervisor monitor + STT safety** — Monitor UI + API; escalation ack; `VOICE_STT_LOW_CONFIDENCE_RAIL`. Phase 2 ~88%. |
| 2026-06-10 | **Tenant compliance policy + VoiceEvent table** — `VoiceTenantCompliancePolicy`, `/Compliance` UI, `GET /events`. Phase 3 ~85%. |
| 2026-06-10 | **Unified analytics** — `loadUnifiedVoiceAnalytics`, `GET /unified-analytics`, Analytics workspace cross-channel KPIs. Phase 3 ~78%. |
| 2026-06-08 | **Phase 3.4 cross-module bundles** — finance collections, support case, marketing hot-lead; `post-call-bundles.ts`; telephony + browser-live hooks. |
| 2026-06-08 | **Phase 3.2 data model closeout** — `VoiceCrmLink` + `interruptedFlag`; `GET /crm-links` smoke. |
| 2026-06-08 | **Phase 3.1 compliance audit** — consent on session start, retention/recording on closeout, outbound dial disclosure, redacted inbox export + audit API. |
| 2026-06-08 | **Phase 3.2 campaign schema** — `triggerSource` + `businessHoursJson` on `VoiceAgentCampaign`; dialer `outside_business_hours` gate; trigger routes stamp source. |
| 2026-06-08 | **Phase 3.2 Voice RBAC** — `voice.configure` / `voice.operate` / `voice.listen` permissions, `requireVoiceAccess` on Phase 2+ routes, sidebar gating via `useVoiceCapability`. |
| 2026-06-08 | **Phase 3.3 Voice Inbox** — `/Inbox` UI, `loadVoiceInbox`, `GET inbox` + `GET inbox/export`; smoke `voice-agent:smoke-voice-inbox-no-404`. |
| 2026-06-08 | **Phase 3.1 kickoff — voice-realtime entitlement** — `lib/voice-agent/entitlements.ts`, `requireVoiceRealtimeAccess`, module switcher accepts standalone `voice-realtime` SKU. |
| 2026-06-08 | **Phase 2 exit — full promoter rehearsal green** — `VOICE_REHEARSAL_DIRECT=0` all 5 steps PASS (spoken + escalation on sidecar; trigger/dialer/supervisor on Vercel `voice-rigcolz0o`). Evidence: `docs/evidence/voice-agent/2026-06-06-promoter-demo-rehearsal.md`. Phase 2 **100%**; Phase 3 platform productization is next track. |
