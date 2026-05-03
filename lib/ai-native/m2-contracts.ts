/**
 * M2 Data Contracts — Marketplace, Calls, CPQ, SDR
 *
 * All public-facing Zod schemas for M2 API surfaces.
 * Import individual schemas as needed; do not import the whole module
 * on hot paths.
 */
import { z } from 'zod'

// ─────────────────────────────────────────────
// Marketplace
// ─────────────────────────────────────────────

export const marketplaceAppSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  icon: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().int().nonnegative().optional(),
  installed: z.boolean().default(false),
  status: z.enum(['available', 'installed', 'error', 'pending']).default('available'),
  permissions: z.array(z.string()).default([]),
  event_subscriptions: z.array(z.string()).default([]),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']).default('free'),
  install_count: z.number().int().nonnegative().default(0),
  schema_version: z.string().default('1.0'),
})

export type MarketplaceApp = z.infer<typeof marketplaceAppSchema>

export const marketplaceInstallBodySchema = z.object({
  app_id: z.string().min(1, 'app_id is required'),
  config: z.record(z.unknown()).optional(),
})

export const marketplaceConfigureBodySchema = z.object({
  config: z.record(z.unknown()),
})

// ─────────────────────────────────────────────
// Calls / Voice
// ─────────────────────────────────────────────

export const callStartBodySchema = z.object({
  phone_number: z.string().min(1, 'phone_number is required'),
  direction: z.enum(['INBOUND', 'OUTBOUND']).default('OUTBOUND'),
  contact_id: z.string().optional(),
  deal_id: z.string().optional(),
  lead_id: z.string().optional(),
  notes: z.string().optional(),
})

export const callLogBodySchema = z.object({
  phone_number: z.string().min(1),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  duration_seconds: z.number().int().nonnegative().optional(),
  status: z.enum(['COMPLETED', 'MISSED', 'FAILED', 'BUSY', 'NO_ANSWER']).default('COMPLETED'),
  contact_id: z.string().optional(),
  deal_id: z.string().optional(),
  lead_id: z.string().optional(),
  notes: z.string().optional(),
  occurred_at: z.string().datetime().optional(),
})

export const callEndBodySchema = z.object({
  status: z.enum(['COMPLETED', 'MISSED', 'FAILED', 'BUSY', 'NO_ANSWER']).default('COMPLETED'),
  duration_seconds: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  disposition: z.string().optional(),
})

export const callTranscriptBodySchema = z.object({
  transcript: z.array(
    z.object({
      speaker: z.enum(['agent', 'customer', 'system']),
      text: z.string(),
      confidence: z.number().min(0).max(1).optional(),
      started_at_seconds: z.number().nonnegative().optional(),
      redacted: z.boolean().default(false),
    })
  ),
  summary: z.string().optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  schema_version: z.string().default('1.0'),
})

export const callLogPublicSchema = z.object({
  id: z.string(),
  phone_number: z.string(),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  status: z.string(),
  duration_seconds: z.number().nullable(),
  contact_id: z.string().nullable(),
  deal_id: z.string().nullable(),
  lead_id: z.string().nullable(),
  notes: z.string().nullable(),
  summary: z.string().nullable(),
  sentiment: z.string().nullable(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  schema_version: z.string(),
})

export type CallLog = z.infer<typeof callLogPublicSchema>

// ─────────────────────────────────────────────
// CPQ / Quotes
// ─────────────────────────────────────────────

export const quoteLineItemSchema = z.object({
  product_id: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  discount_percent: z.number().min(0).max(100).default(0),
  tax_percent: z.number().min(0).max(100).default(0),
})

export const quoteCreateBodySchema = z.object({
  deal_id: z.string().min(1, 'deal_id is required'),
  contact_id: z.string().optional(),
  valid_until: z.string().datetime().optional(),
  notes: z.string().optional(),
  line_items: z.array(quoteLineItemSchema).min(1, 'At least one line item is required'),
  discount_percent: z.number().min(0).max(100).default(0),
  tax_percent: z.number().min(0).max(100).default(0),
})

export const quoteApproveBodySchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
  approver_note: z.string().optional(),
})

export const quotePublicSchema = z.object({
  id: z.string(),
  quote_number: z.string(),
  deal_id: z.string().nullable(),
  contact_id: z.string().nullable(),
  status: z.string(),
  subtotal: z.number(),
  discount_amount: z.number(),
  tax_amount: z.number(),
  total: z.number(),
  valid_until: z.string().nullable(),
  notes: z.string().nullable(),
  conversion_status: z.enum(['pending', 'converted', 'expired', 'rejected']).optional(),
  schema_version: z.string(),
})

export type Quote = z.infer<typeof quotePublicSchema>

// ─────────────────────────────────────────────
// SDR (AI Sales Development Representative)
// ─────────────────────────────────────────────

export const sdrGuardrailsSchema = z.object({
  require_approval: z.boolean().optional(),
  max_contacts: z.number().int().positive().optional(),
  max_contacts_per_run: z.number().int().positive().optional(),
  cooldown_hours: z.number().nonnegative().optional(),
  allowed_channels: z.array(z.string()).optional(),
  blackout_hours: z
    .object({ start: z.number().int().min(0).max(23), end: z.number().int().min(0).max(23) })
    .optional(),
})

export const sdrPlaybookBodySchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  steps: z.array(
    z.object({
      step_type: z.enum(['email', 'sms', 'call', 'whatsapp', 'wait', 'condition']),
      delay_hours: z.number().nonnegative().default(0),
      template_id: z.string().optional(),
      message: z.string().optional(),
      condition: z.record(z.unknown()).optional(),
    })
  ).min(1, 'At least one step is required'),
  guardrails: sdrGuardrailsSchema.optional(),
})

export const sdrRunStartBodySchema = z.object({
  contact_ids: z.array(z.string()).min(1, 'At least one contact_id is required'),
  guardrails: sdrGuardrailsSchema.optional(),
})

export const sdrRunStopBodySchema = z.object({
  reason: z.string().min(1, 'reason is required'),
})

export const sdrRunPublicSchema = z.object({
  id: z.string(),
  playbook_id: z.string(),
  status: z.enum(['running', 'paused', 'stopped', 'completed', 'failed']),
  contact_count: z.number().int().nonnegative(),
  guardrails: sdrGuardrailsSchema.optional(),
  started_at: z.string().nullable(),
  paused_at: z.string().nullable().optional(),
  stopped_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  stop_reason: z.string().nullable().optional(),
  schema_version: z.string().default('1.0'),
})

// Compatibility contract schemas used by M2 contract smoke tests.
export const callLogSchema = z.object({
  schema_version: z.literal('1.0'),
  id: z.string(),
  tenant_id: z.string(),
  entity_type: z.enum(['contact', 'lead', 'deal']).optional(),
  entity_id: z.string().optional(),
  direction: z.enum(['inbound', 'outbound']),
  status: z.enum(['queued', 'ringing', 'in-progress', 'completed', 'failed', 'no-answer', 'busy']),
  duration_seconds: z.number().int().nonnegative().optional(),
  from_number: z.string(),
  to_number: z.string(),
  recording_url: z.string().url().optional(),
  summary: z.string().optional(),
  started_at: z.string().datetime(),
  ended_at: z.string().datetime().optional(),
})

export const callTranscriptSchema = z.object({
  schema_version: z.literal('1.0'),
  id: z.string(),
  call_id: z.string(),
  segments: z.array(
    z.object({
      speaker: z.enum(['agent', 'customer', 'unknown']),
      text: z.string(),
      start_ms: z.number().int().nonnegative(),
      end_ms: z.number().int().nonnegative(),
      confidence: z.number().min(0).max(1),
      redacted: z.boolean().default(false),
    })
  ),
  language: z.string().default('en'),
  word_count: z.number().int().nonnegative().optional(),
  redacted_count: z.number().int().nonnegative().optional(),
  created_at: z.string().datetime(),
})

export const quoteContractSchema = z.object({
  schema_version: z.literal('1.0'),
  id: z.string(),
  tenant_id: z.string(),
  deal_id: z.string(),
  contact_id: z.string().optional(),
  quote_number: z.string(),
  status: z.enum(['draft', 'pending_approval', 'sent', 'viewed', 'accepted', 'expired', 'rejected']),
  requires_approval: z.boolean(),
  line_items: z.array(
    z.object({
      id: z.string(),
      product_id: z.string().optional(),
      name: z.string(),
      description: z.string().optional(),
      quantity: z.number().positive(),
      unit_price: z.number().nonnegative(),
      tax_rate: z.number().min(0).max(1).default(0),
      discount_rate: z.number().min(0).max(1).default(0),
      total: z.number(),
    })
  ),
  subtotal: z.number(),
  tax: z.number(),
  discount: z.number(),
  total: z.number(),
  valid_until: z.string().datetime().optional(),
  notes: z.string().optional(),
  converted_to_invoice_id: z.string().optional(),
  converted_at: z.string().datetime().optional(),
})

export const sdrRunSchema = z.object({
  schema_version: z.literal('1.0'),
  id: z.string(),
  playbook_id: z.string(),
  tenant_id: z.string(),
  status: z.enum(['pending', 'running', 'paused', 'completed', 'stopped']),
  guardrails: sdrGuardrailsSchema.optional(),
  stop_reason: z.string().optional(),
  policy_decisions: z.array(
    z.object({
      decision_type: z.string(),
      outcome: z.enum(['allowed', 'blocked', 'queued']),
      reason: z.string().optional(),
      occurred_at: z.string().datetime(),
    })
  ).optional(),
  started_at: z.string().datetime().optional(),
  paused_at: z.string().datetime().optional(),
  stopped_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
})

export type SdrPlaybook = {
  id: string
  name: string
  description?: string | null
  is_active: boolean
  steps: unknown
  run_count: number
  created_at: Date
  updated_at: Date
}

export type SdrRun = z.infer<typeof sdrRunPublicSchema>
