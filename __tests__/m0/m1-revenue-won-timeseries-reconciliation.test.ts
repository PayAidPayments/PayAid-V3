import { beforeEach, describe, expect, it, jest } from '@jest/globals'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    deal: {
      findMany: jest.fn(),
    },
  },
}))

import { getRevenueWonTimeseries } from '@/lib/ai-native/m1-revenue-service'

describe('getRevenueWonTimeseries — reconciliation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('buckets won deals by UTC month using actualCloseDate (fallback updatedAt)', async () => {
    const prisma = require('@/lib/db/prisma')
    prisma.prisma.deal.findMany.mockResolvedValue([
      { value: 100, actualCloseDate: new Date('2026-02-10T12:00:00.000Z'), updatedAt: new Date('2026-02-11T00:00:00.000Z') },
      { value: 50, actualCloseDate: null, updatedAt: new Date('2026-03-05T00:00:00.000Z') },
    ])

    const out = await getRevenueWonTimeseries('tenant_a', 3)
    expect(out.months).toBe(3)

    const feb = out.points.find((p) => p.month_start.startsWith('2026-02-01'))
    const mar = out.points.find((p) => p.month_start.startsWith('2026-03-01'))
    expect(feb?.won_deal_count).toBe(1)
    expect(feb?.won_value_inr).toBe(100)
    expect(mar?.won_deal_count).toBe(1)
    expect(mar?.won_value_inr).toBe(50)
  })
})

