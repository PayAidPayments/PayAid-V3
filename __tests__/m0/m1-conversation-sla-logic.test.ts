import { describe, expect, it } from '@jest/globals'
import {
  computeUniboxSlaPresentation,
  resolveSlaDueAtFromIngest,
} from '@/lib/ai-native/m1-conversation-sla'
import type { ConversationIngest } from '@/lib/ai-native/m1-conversations'

const base: ConversationIngest = {
  schema_version: '1.0',
  tenant_id: 't1',
  conversation_id: 'c1',
  channel: 'email',
  direction: 'inbound',
  body: 'Hi',
  occurred_at: '2026-04-07T12:00:00.000Z',
  metadata: {},
}

describe('resolveSlaDueAtFromIngest', () => {
  it('uses metadata.sla_due_at when valid ISO', () => {
    const d = resolveSlaDueAtFromIngest({
      ...base,
      metadata: { sla_due_at: '2026-04-07T14:00:00.000Z' },
    })
    expect(d?.toISOString()).toBe('2026-04-07T14:00:00.000Z')
  })

  it('derives deadline from first_response_sla_minutes after occurred_at', () => {
    const d = resolveSlaDueAtFromIngest({
      ...base,
      metadata: { first_response_sla_minutes: 30 },
    })
    expect(d?.toISOString()).toBe('2026-04-07T12:30:00.000Z')
  })

  it('prefers explicit sla_due_at over minutes when both present', () => {
    const d = resolveSlaDueAtFromIngest({
      ...base,
      metadata: {
        sla_due_at: '2026-04-07T18:00:00.000Z',
        first_response_sla_minutes: 15,
      },
    })
    expect(d?.toISOString()).toBe('2026-04-07T18:00:00.000Z')
  })

  it('returns undefined for invalid sla_due_at string but valid minutes', () => {
    const d = resolveSlaDueAtFromIngest({
      ...base,
      metadata: { sla_due_at: 'not-a-date', first_response_sla_minutes: 10 },
    })
    expect(d?.toISOString()).toBe('2026-04-07T12:10:00.000Z')
  })
})

describe('computeUniboxSlaPresentation (breach vs open + clock)', () => {
  const due = new Date('2026-04-07T13:00:00.000Z')

  it('marks breached when open and now is past slaDueAt', () => {
    const nowMs = new Date('2026-04-07T13:01:00.000Z').getTime()
    expect(computeUniboxSlaPresentation({ slaDueAt: due, status: 'open', nowMs }).breached).toBe(true)
  })

  it('does not mark breached when status is not open', () => {
    const nowMs = new Date('2026-04-07T14:00:00.000Z').getTime()
    expect(
      computeUniboxSlaPresentation({ slaDueAt: due, status: 'resolved', nowMs }).breached
    ).toBe(false)
  })

  it('due_in_seconds negative after deadline when still open', () => {
    const nowMs = new Date('2026-04-07T13:05:00.000Z').getTime()
    const s = computeUniboxSlaPresentation({ slaDueAt: due, status: 'open', nowMs })
    expect(s.due_in_seconds).toBe(-300)
    expect(s.breached).toBe(true)
  })
})
