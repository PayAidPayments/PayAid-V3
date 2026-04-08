import { describe, expect, it } from '@jest/globals'
import {
  revenueFunnelResponseSchema,
  revenueVelocityResponseSchema,
  revenueNextActionsResponseSchema,
  revenueFeedbackBodySchema,
} from '@/lib/ai-native/m1-revenue'

describe('M1 revenue contracts', () => {
  it('parses funnel response', () => {
    const parsed = revenueFunnelResponseSchema.safeParse({
      schema_version: '1.0',
      tenant_id: 't1',
      as_of: new Date().toISOString(),
      stages: [{ stage: 'lead', deal_count: 2, total_value_inr: 1000, percent_of_open_pipeline: 1 }],
      open_deal_count: 2,
      open_pipeline_value_inr: 1000,
      closed_won_count_30d: 0,
      closed_won_value_inr_30d: 0,
      closed_won_count_prev_30d: 0,
      closed_won_value_inr_prev_30d: 0,
    })
    expect(parsed.success).toBe(true)
  })

  it('parses velocity response', () => {
    const parsed = revenueVelocityResponseSchema.safeParse({
      schema_version: '1.0',
      tenant_id: 't1',
      window_days: 30,
      as_of: new Date().toISOString(),
      avg_days_open_deal_age: 5,
      median_days_open_deal_age: 4,
      by_stage: [{ stage: 'lead', deal_count: 1, avg_days_since_created: 3, median_days_since_created: 3 }],
      won_deals_in_window: { count: 0, total_value_inr: 0 },
    })
    expect(parsed.success).toBe(true)
  })

  it('parses next-actions response', () => {
    const parsed = revenueNextActionsResponseSchema.safeParse({
      schema_version: '1.0',
      tenant_id: 't1',
      as_of: new Date().toISOString(),
      recommendations: [
        {
          id: 'rec_x',
          deal_id: 'd1',
          deal_name: 'Acme',
          stage: 'lead',
          value_inr: 10000,
          risk_score: 0.4,
          recommendation_rationale: 'Test',
          suggested_action: 'follow_up',
        },
      ],
    })
    expect(parsed.success).toBe(true)
  })

  it('parses feedback body', () => {
    const parsed = revenueFeedbackBodySchema.safeParse({
      recommendation_id: 'rec_1',
      deal_id: 'd1',
      accepted: true,
      note: 'ok',
    })
    expect(parsed.success).toBe(true)
  })
})
