import type { TrainingPackApprovedSnapshot } from '@/lib/voice-agent/training-pack-types'

/** Minimal draft shape validation for training pack JSON */
export function parseTrainingPackDraft(raw: unknown): TrainingPackApprovedSnapshot {
  if (!raw || typeof raw !== 'object') return {}
  const o = raw as Record<string, unknown>
  const out: TrainingPackApprovedSnapshot = {}

  if (Array.isArray(o.sampleConversations)) {
    out.sampleConversations = o.sampleConversations
      .filter(
        (x): x is { user: string; assistant: string } =>
          !!x && typeof x === 'object' && typeof (x as { user?: string }).user === 'string',
      )
      .map((x) => ({
        user: String((x as { user: string }).user).slice(0, 4000),
        assistant: String((x as { assistant?: string }).assistant ?? '').slice(0, 4000),
      }))
  }
  if (Array.isArray(o.goodBadExamples)) {
    out.goodBadExamples = o.goodBadExamples
      .filter((x) => !!x && typeof x === 'object')
      .map((x) => {
        const g = x as { scenario?: string; good?: string; bad?: string; why?: string }
        return {
          scenario: g.scenario ? String(g.scenario).slice(0, 500) : undefined,
          good: String(g.good ?? '').slice(0, 4000),
          bad: String(g.bad ?? '').slice(0, 4000),
          why: g.why ? String(g.why).slice(0, 1000) : undefined,
        }
      })
  }
  if (Array.isArray(o.bannedPhrases)) {
    out.bannedPhrases = o.bannedPhrases.filter((p) => typeof p === 'string').map((p) => p.slice(0, 200))
  }
  if (Array.isArray(o.objections)) {
    out.objections = o.objections
      .filter((x) => !!x && typeof x === 'object')
      .map((x) => ({
        trigger: String((x as { trigger?: string }).trigger ?? '').slice(0, 500),
        response: String((x as { response?: string }).response ?? '').slice(0, 2000),
      }))
  }
  if (Array.isArray(o.escalations)) {
    out.escalations = o.escalations
      .filter((x) => !!x && typeof x === 'object')
      .map((x) => ({
        when: String((x as { when?: string }).when ?? '').slice(0, 500),
        action: String((x as { action?: string }).action ?? '').slice(0, 2000),
      }))
  }
  if (typeof o.notes === 'string' && o.notes.trim()) {
    out.notes = o.notes.trim().slice(0, 8000)
  }

  return out
}

export function canApproveVoiceAgentTraining(roles: string[]): boolean {
  const lowered = roles.map((r) => r.toLowerCase())
  return lowered.some((r) => ['admin', 'owner', 'tenant_admin', 'super_admin'].includes(r))
}
