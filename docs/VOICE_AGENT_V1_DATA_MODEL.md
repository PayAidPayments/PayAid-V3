# Voice Agents v1 Data Model (Phase 3 freeze)

**Status:** Frozen for Phase 3 closeout — metadata-based v1  
**Blueprint entities:** `VoiceOutcome`, `VoiceArtifact`  
**Decision:** Defer dedicated Prisma tables; use typed metadata accessors until query/retention needs justify migration.

## Mapping

| Blueprint entity | v1 storage | Reader |
|------------------|------------|--------|
| VoiceOutcome | `VoiceAgentCall.outcomeCode` + `metadataJson.postCall` / `VoiceDemoSession.metadataJson.postCall` | `readVoiceOutcomeV1()` |
| VoiceArtifact | `VoiceAgentCall.recordingUrl` + `transcript` / `transcriptJson` + `metadataJson.postCall.recording` | `readVoiceArtifactV1()` |
| VoiceTurn | `CallMessage` + `transcriptJson` turns + `interruptedFlag` | existing demo/telephony parsers |
| CRMLink | `VoiceCrmLink` table | `loadVoiceCrmLinks()` |

## Schema version

All v1 outcome/artifact payloads include `schema: "voice-outcome-artifact-v1"` when written through post-call pipelines.

## Phase 4 trigger (when to promote tables)

- Cross-tenant analytics on outcomes without JSON scans
- Retention jobs on artifacts independent of parent call row
- Compliance export requiring immutable artifact rows
