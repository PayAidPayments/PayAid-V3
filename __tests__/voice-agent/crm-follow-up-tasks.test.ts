import {
  buildFollowUpTaskDrafts,
} from '@/lib/voice-agent/crm-follow-up-tasks'

describe('buildFollowUpTaskDrafts', () => {
  it('maps escalation and callback objections to tasks', () => {
    const drafts = buildFollowUpTaskDrafts(['escalation_request', 'callback_requested'])
    expect(drafts).toHaveLength(2)
    expect(drafts[0].title).toContain('escalation')
    expect(drafts[1].title).toContain('callback')
  })

  it('dedupes repeated tags', () => {
    const drafts = buildFollowUpTaskDrafts(['price_objection', 'price_objection'])
    expect(drafts).toHaveLength(1)
  })

  it('returns empty for unknown tags', () => {
    expect(buildFollowUpTaskDrafts(['unknown_tag'])).toEqual([])
  })
})
