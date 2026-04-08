import { beforeEach, describe, expect, it, jest } from '@jest/globals'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    deal: {
      findMany: jest.fn(),
    },
  },
}))

import { getRevenueNextActions } from '@/lib/ai-native/m1-revenue-service'

describe('getRevenueNextActions — CRM ground-truth reconciliation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns at most cap recommendations; each recommendation references a fetched deal id', async () => {
    const prisma = require('@/lib/db/prisma')
    const deals = [
      { id: 'd1', name: 'A', stage: 'lead', value: 1e6, updatedAt: new Date('2026-04-01') },
      { id: 'd2', name: 'B', stage: 'proposal', value: 2e6, updatedAt: new Date('2026-04-02') },
      { id: 'd3', name: 'C', stage: 'negotiation', value: 3e6, updatedAt: new Date('2026-04-03') },
    ]
    prisma.prisma.deal.findMany.mockResolvedValue(deals)

    const out = await getRevenueNextActions('tenant_a', 2)
    expect(out.recommendations.length).toBeLessThanOrEqual(2)
    const ids = new Set(deals.map((d) => d.id))
    for (const r of out.recommendations) {
      expect(ids.has(r.deal_id)).toBe(true)
      expect(r.id).toBe(`rec_${r.deal_id}`)
    }
  })
})
