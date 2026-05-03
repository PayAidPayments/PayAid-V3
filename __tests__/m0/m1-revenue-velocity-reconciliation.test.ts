import { beforeEach, describe, expect, it, jest } from '@jest/globals'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    deal: {
      findMany: jest.fn(),
    },
  },
}))

import { getRevenueVelocity } from '@/lib/ai-native/m1-revenue-service'

describe('getRevenueVelocity — CRM ground-truth reconciliation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('by_stage deal_count sums to open pipeline count; won window value matches raw won deals', async () => {
    const prisma = require('@/lib/db/prisma')
    const open = [
      { stage: 'lead', createdAt: new Date('2026-01-01') },
      { stage: 'proposal', createdAt: new Date('2026-02-01') },
      { stage: 'lead', createdAt: new Date('2026-03-01') },
    ]
    const won = [{ value: 1000 }, { value: 250 }]
    prisma.prisma.deal.findMany.mockResolvedValueOnce(open).mockResolvedValueOnce(won)

    const out = await getRevenueVelocity('tenant_a', 30)

    const sumStageCounts = out.by_stage.reduce((s, x) => s + x.deal_count, 0)
    expect(sumStageCounts).toBe(open.length)
    expect(out.won_deals_in_window.count).toBe(won.length)
    expect(out.won_deals_in_window.total_value_inr).toBe(1250)
  })
})
