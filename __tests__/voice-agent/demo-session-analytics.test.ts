import { aggregateDemoSessionAnalytics } from '@/lib/voice-agent/demo-session-analytics'

describe('aggregateDemoSessionAnalytics', () => {
  it('aggregates routing and sentiment from ended sessions', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        metadataJson: {
          postCall: {
            routing: 'unmatched_lead',
            sentiment: { sentiment: 'positive', score: 0.6 },
            objectionTags: ['callback_requested'],
            entities: { turnCount: 4 },
            crm: { followUpTaskIds: ['task_1'] },
          },
          bargeInCount: 1,
        },
      },
      {
        metadataJson: {
          postCall: {
            routing: 'matched_contact',
            sentiment: { sentiment: 'neutral', score: 0 },
            objectionTags: [],
            entities: { turnCount: 2 },
          },
        },
      },
    ])

    const prisma = {
      voiceDemoSession: { findMany },
    } as unknown as import('@prisma/client').PrismaClient

    const result = await aggregateDemoSessionAnalytics(prisma, {
      tenantId: 'tenant_1',
      agentId: 'agent_1',
    })

    expect(result.endedCount).toBe(2)
    expect(result.routing.unmatched_lead).toBe(1)
    expect(result.routing.matched_contact).toBe(1)
    expect(result.sentiment.positive).toBe(1)
    expect(result.objectionTags.callback_requested).toBe(1)
    expect(result.followUpTasksCreated).toBe(1)
    expect(result.bargeInSessions).toBe(1)
  })
})
