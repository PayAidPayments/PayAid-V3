# Voice Inbox Phase 3.3 — evidence

**Date:** 2026-06-08  
**Branch:** `feat/voice-agents-phase2-exit` (PR #16)  
**Commit:** `177c7a8d6` — feat(voice): add Voice Inbox UI and export API for Phase 3.3

## Deliverables

| Item | Path |
|------|------|
| Inbox loader | `lib/voice-agent/voice-inbox.ts` |
| List API | `GET /api/v1/voice-agents/inbox` |
| Export API | `GET /api/v1/voice-agents/inbox/export` |
| UI | `/voice-agents/{tenantId}/Inbox` + `VoiceInboxWorkspace` |
| Smoke | `npm run voice-agent:smoke-voice-inbox-no-404` |
| Unit tests | `__tests__/voice-agent/voice-inbox.test.ts` |

## Vercel deploy

- **Production URL:** https://voice-bs5o86dqb-payaid-projects-a67c6b27.vercel.app  
- **Alias:** https://voice-six-xi.vercel.app  
- **Deployment:** `dpl_5i6EBPp5n73s8RQS6ELCusx9GHbb` — READY

## HTTP smoke (alias)

```json
{
  "ok": true,
  "page": { "ok": true, "status": 200 },
  "api": { "ok": true, "status": 200 }
}
```

Command: `VOICE_BASE_URL=https://voice-six-xi.vercel.app npm run voice-agent:smoke-voice-inbox-no-404`

## Routing filter

Sessions included when `postCall.routing === 'no_crm_inbox'`, `postCall.crm.inboxOnly === true`, or `postCall.disposition === 'spoken_demo_inbox'`.
