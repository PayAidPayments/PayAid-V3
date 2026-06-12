# Voice Agents — Security Roadmap & Implementation Tracker

**Aligned with:** [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html), [OWASP LLM Prompt Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)  
**Blueprint:** [`voice_agents_module_blueprint.md`](../voice_agents_module_blueprint.md) — Phase 4 Security  
**Checklist:** [`VOICE_AGENTS_MODULE_BLUEPRINT_CHECKLIST.md`](./VOICE_AGENTS_MODULE_BLUEPRINT_CHECKLIST.md) — §Phase 4 Security

**Last updated:** 2026-06-12

**Scope note:** Telephony guardrails **deferred** with PSTN. Investor milestone = **browser-live only** — input/output guardrails, KB sandbox, and tool gateway are in scope now.

---

## Principles (defense in depth)

1. **Treat all external input as untrusted** — spoken transcripts, CRM notes, KB chunks, webhook JSON, ad-lead payloads.
2. **Separate trusted instructions from user/retrieved content** — system prompt vs delimited KB blocks.
3. **Model suggests; runtime decides** — tools never execute directly from LLM output without gateway checks.
4. **Least privilege** — tenant entitlements, voice RBAC, per-agent tool allowlists.
5. **Human approval for high-risk actions** — payments, refunds, outbound contact changes, legal/compliance edits.
6. **Audit everything security-relevant** — `VoiceEvent`, `AuditLog`, compliance trail.

---

## Implementation matrix

| Control | Stage | Status | Code / notes |
|---------|-------|--------|--------------|
| Prompt/data separation (KB sandbox) | Now | **Done** | `wrapUntrustedKnowledgeBaseContent()` in `agent-runtime-context.ts` |
| Input guardrails (injection heuristics) | Now | **Done** | `assessVoiceUserInput()` — `lib/voice-agent/security/voice-guardrails.ts` |
| Output guardrails (secrets/PII) | Now | **Done** | `assessVoiceAgentOutput()` — wired in `browser-live/turn-handler.ts` |
| Tool allowlist + denylist | Now | **Done** | `tool-gateway.ts` + `browser-live/tool-safety.ts` |
| Draft-first / human approval (payments) | Now | **Done** | `bolna-tool-policy.ts`, Bolna bridge, browser-live tools |
| Tenant entitlements | Now | **Done** | `entitlements.ts`, Bolna bridge license check |
| Voice RBAC (configure/operate/listen) | Now | **Done** | `rbac.ts`, API routes |
| Compliance audit (consent/retention/redaction) | Now | **Done** | `compliance-audit.ts`, `runtime-compliance.ts` |
| STT low-confidence rail | Now | **Done** | `stt-safety.ts`, `VOICE_STT_LOW_CONFIDENCE_RAIL=1` |
| Twilio webhook signature verify | Now | **Done** | `twilio-webhook-signature.ts` |
| DND / telephony abuse (India) | Now | **Partial** | `dnd-checker.ts` on campaign dialer; per-tenant rate limits **pending** |
| Trigger webhook auth | Now | **Partial** | Shared trigger auth; HMAC on all marketing/website triggers **pending** |
| Bolna bridge JWT + secret | Now | **Done** | `bridge-auth.ts`, per-call JWT |
| Security event logging | Next | **Partial** | Guardrail blocks should emit `security.input_blocked` / `security.output_redacted` **pending** |
| Telephony input/output guardrails | Next | **Pending** | Wire guardrails into Bolna prompt path + post-STT telephony |
| Structured tool JSON schema validation | Next | **Partial** | `ToolExecutor.validateParameters`; stricter zod per tool **pending** |
| Per-tenant guardrail policy UI | Later | **Pending** | Extend `VoiceTenantCompliancePolicy` or new `VoiceSecurityPolicy` |
| Dedicated guardrail microservice | Later | **Planned** | When traffic/compliance isolation justifies split |
| LangChain orchestration | Optional | **Not required** | Use only if multi-step chains reduce duplication; security stays in policy layer |
| SSRF protection on HTTP tools | Next | **Pending** | Allowlist egress hosts for tool HTTP callbacks |
| Embed/widget CSP + origin allowlist | Next | **Pending** | `apps/voice/app/embed.js` tenant config |
| Prompt injection regression tests | Next | **Partial** | `voice-guardrails.test.ts`; expand corpus **pending** |
| Red-team / eval harness | Later | **Planned** | Scripted injection + tool abuse scenarios in CI |

**Env flags**

| Flag | Default | Purpose |
|------|---------|---------|
| `VOICE_GUARDRAILS` | `1` in production, off in dev unless set | Master guardrail switch |
| `VOICE_STT_LOW_CONFIDENCE_RAIL` | off unless `1` | Reject weak STT before LLM |
| `VOICE_MARKETING_HOT_LEAD_MIN_SCORE` | `70` | Marketing trigger abuse gate |

---

## Rollout sequence (recommended)

### 1. Now (in-app policy layer) — **active**

- Input/output guardrails on browser-live turns
- KB untrusted delimiters in system prompt merge
- Tool gateway (allowlist, draft-first, deny dangerous names)
- Existing RBAC, entitlements, compliance, Twilio signature, DND

### 2. Next (shared runtime policy)

- Apply same guardrails to **telephony/Bolna** transcript path before tool execution
- Emit durable `security.*` events to `VoiceEvent`
- HMAC + replay protection on **all** trigger webhooks (website, Facebook, LinkedIn, CRM stage)
- Per-tenant **call rate limits** and campaign spend caps
- SSRF-safe HTTP tool executor

### 3. Then (service boundaries — when scale/compliance requires)

| Service | When to split |
|---------|----------------|
| Speech / media gateway | Telephony scales independently from dashboard |
| Policy / guardrail service | Regulated tenants, multiple LLM providers, centralized policy edits |
| Event ingestion | High-volume `VoiceEvent` + security audit replay |
| Telephony worker | Isolated Twilio/Bolna credentials and blast-radius |
| Analytics pipeline | Read-only consumers, no runtime trust |

### 4. Parallel (natural Indian-language quality)

- Code-switching STT/TTS routing (Sarvam-first policy)
- Language-aware prosody / pace presets (`voice-behavior-config.ts`)
- Short-turn acknowledgements (“ji”, “haan”, backchannels)
- Real-call tuning datasets (not framework complexity)

---

## Architecture (current stage)

```
Caller / Webhook / KB
        │
        ▼
┌───────────────────┐
│ Input guardrails  │  sanitize, injection heuristics, length caps
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Runtime + LLM     │  trusted system prompt + UNTRUSTED_KB delimiters
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Output guardrails │  secrets, PII, policy violations
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Tool gateway      │  allowlist, draft-first, tenant scope
└─────────┬─────────┘
          ▼
   TTS / CRM / Events (audited)
```

---

## Additional PayAid-specific recommendations

1. **Never log raw JWTs, bridge secrets, or full transcripts in production** — use structured logging with redaction (`compliance-audit.redactVoiceText`).
2. **Rotate `BOLNA_BRIDGE_SECRET` and Twilio auth on a schedule** — document in Stage 1 runbook.
3. **Separate Vercel voice project credentials** from dashboard; minimal env surface per app.
4. **Campaign outbound caps** — max dials/hour/tenant, business hours, DND batch (extend `campaign-dialer.ts`).
5. **Operator approval queue** for draft-first tool results (UI on Monitor workspace).
6. **Tenant data residency flag** (blueprint Tier 3) — block cross-region LLM routing when enabled.
7. **Pen-test voice triggers** before exposing public marketing webhooks without shared secrets.
8. **Browser-live embed** — tenant-scoped `allowedOrigins` before mic capture.
9. **Principle of least data in prompts** — CRM context snippets only, not full contact records.
10. **Incident runbook** — if injection suspected: disable agent, preserve `VoiceEvent` + session metadata, rotate secrets.

---

## Update log

| Date | Change |
|------|--------|
| 2026-06-12 | Initial security roadmap; `voice-guardrails.ts`, `tool-gateway.ts`; wired browser-live + KB sandbox; tests added. |
