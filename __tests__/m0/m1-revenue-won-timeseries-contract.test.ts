import { describe, expect, it } from '@jest/globals'
import { revenueWonTimeseriesResponseSchema } from '@/lib/ai-native/m1-revenue'

describe('M1 revenue won-timeseries contract', () => {
  it('parses response', () => {
    const parsed = revenueWonTimeseriesResponseSchema.safeParse({
      schema_version: '1.0',
      tenant_id: 't1',
      as_of: new Date().toISOString(),
      months: 6,
      points: [{ month_start: new Date().toISOString(), won_deal_count: 1, won_value_inr: 1000 }],
    })
    expect(parsed.success).toBe(true)
  })
})

