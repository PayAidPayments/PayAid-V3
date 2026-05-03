import { z } from 'zod'

/** Ordered CRM deal stages for funnel display (open pipeline). */
export const REVENUE_FUNNEL_STAGE_ORDER = [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
] as const

export const revenueFunnelStageSchema = z.object({
  stage: z.string(),
  deal_count: z.number().int().nonnegative(),
  total_value_inr: z.number(),
  percent_of_open_pipeline: z.number().min(0).max(1).optional(),
})

export const revenueFunnelResponseSchema = z.object({
  schema_version: z.literal('1.0'),
  tenant_id: z.string(),
  as_of: z.string(),
  stages: z.array(revenueFunnelStageSchema),
  open_deal_count: z.number().int().nonnegative(),
  open_pipeline_value_inr: z.number(),
  closed_won_count_30d: z.number().int().nonnegative(),
  closed_won_value_inr_30d: z.number(),
  /** Won deals in the prior 30-day window (days 31–60 ago), same heuristics as last 30d. */
  closed_won_count_prev_30d: z.number().int().nonnegative(),
  closed_won_value_inr_prev_30d: z.number(),
})

export const revenueVelocityStageSchema = z.object({
  stage: z.string(),
  deal_count: z.number().int().nonnegative(),
  avg_days_since_created: z.number().nullable(),
  median_days_since_created: z.number().nullable(),
})

export const revenueVelocityResponseSchema = z.object({
  schema_version: z.literal('1.0'),
  tenant_id: z.string(),
  window_days: z.number().int().positive(),
  as_of: z.string(),
  avg_days_open_deal_age: z.number().nullable(),
  median_days_open_deal_age: z.number().nullable(),
  by_stage: z.array(revenueVelocityStageSchema),
  won_deals_in_window: z.object({
    count: z.number().int().nonnegative(),
    total_value_inr: z.number(),
  }),
})

export const revenueInsightSchema = z.object({
  id: z.string(),
  deal_id: z.string(),
  deal_name: z.string(),
  stage: z.string(),
  value_inr: z.number(),
  risk_score: z.number().min(0).max(1),
  recommendation_rationale: z.string(),
  suggested_action: z.enum(['follow_up', 're_qualify', 'advance_stage', 'review_pricing']),
})

export const revenueNextActionsResponseSchema = z.object({
  schema_version: z.literal('1.0'),
  tenant_id: z.string(),
  as_of: z.string(),
  recommendations: z.array(revenueInsightSchema),
})

export const revenueWonTimeseriesPointSchema = z.object({
  month_start: z.string().datetime(),
  won_deal_count: z.number().int().nonnegative(),
  won_value_inr: z.number(),
})

export const revenueWonTimeseriesResponseSchema = z.object({
  schema_version: z.literal('1.0'),
  tenant_id: z.string(),
  as_of: z.string(),
  months: z.number().int().positive(),
  points: z.array(revenueWonTimeseriesPointSchema),
})

export const revenueFeedbackBodySchema = z.object({
  recommendation_id: z.string().min(1),
  deal_id: z.string().min(1),
  accepted: z.boolean(),
  note: z.string().max(2000).optional(),
})

export type RevenueFeedbackBody = z.infer<typeof revenueFeedbackBodySchema>
