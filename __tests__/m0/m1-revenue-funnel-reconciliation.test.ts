import { beforeEach, describe, expect, it, jest } from '@jest/globals'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    deal: {
      findMany: jest.fn(),
    },
  },
}))

import { getRevenueFunnel } from '@/lib/ai-native/m1-revenue-service'

describe('getRevenueFunnel — CRM ground-truth reconciliation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('open_pipeline_value_inr and stage totals match raw open deals', async () => {
    const prisma = require('@/lib/db/prisma')
    prisma.prisma.deal.findMany
      .mockResolvedValueOnce([
        { stage: 'lead', value: 100 },
        { stage: 'custom_other', value: 50 },
        { stage: 'lead', value: 25 },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ value: 40 }, { value: 10 }])

    const out = await getRevenueFunnel('tenant_a')
    expect(out.open_deal_count).toBe(3)
    expect(out.open_pipeline_value_inr).toBe(175)

    const sumStageCounts = out.stages.reduce((s, x) => s + x.deal_count, 0)
    const sumStageValues = out.stages.reduce((s, x) => s + x.total_value_inr, 0)
    expect(sumStageCounts).toBe(out.open_deal_count)
    expect(sumStageValues).toBe(out.open_pipeline_value_inr)
    expect(out.closed_won_count_prev_30d).toBe(2)
    expect(out.closed_won_value_inr_prev_30d).toBe(50)
  })
})
