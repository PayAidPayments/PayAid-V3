import { z } from 'zod'

/** Inbound/outbound message envelope for Unibox ingestion (M1). */
export const conversationIngestSchema = z.object({
  schema_version: z.string().default('1.0'),
  tenant_id: z.string().min(1),
  conversation_id: z.string().min(1),
  channel: z.enum(['email', 'whatsapp', 'sms', 'web', 'phone', 'in_app']),
  direction: z.enum(['inbound', 'outbound']),
  body: z.string().min(1),
  occurred_at: z.string().datetime(),
  subject: z.string().optional(),
  customer_ref: z
    .object({
      entity_type: z.enum(['lead', 'contact', 'deal', 'account']).optional(),
      entity_id: z.string().optional(),
    })
    .optional(),
  /**
   * Optional: `status`, `owner_user_id`, `tags`, `sentiment`, `sla_due_at` (ISO datetime),
   * `first_response_sla_minutes` (deadline = `occurred_at` + minutes) — persisted on `UniboxConversation`.
   */
  metadata: z.record(z.string(), z.unknown()).default({}),
  trace_id: z.string().min(1).optional(),
})

export type ConversationIngest = z.infer<typeof conversationIngestSchema>

export const conversationAssignSchema = z.object({
  owner_user_id: z.string().min(1),
})

export const conversationReplySchema = z.object({
  body: z.string().min(1).max(20000),
})

export const conversationTagSchema = z.object({
  tags: z.array(z.string().max(80)).max(50),
})

/** Single message line returned by GET /api/v1/conversations/:id/messages */
export const uniboxMessagePublicSchema = z.object({
  id: z.string(),
  direction: z.string(),
  body: z.string(),
  occurred_at: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

/**
 * Public thread aggregate for GET /api/v1/conversations/:id (UniboxConversation row).
 * Ingest may set SLA via `metadata.sla_due_at` (ISO) or `metadata.first_response_sla_minutes` (from `occurred_at`).
 */
export const uniboxConversationPublicSchema = z.object({
  schema_version: z.literal('1.0'),
  id: z.string(),
  thread_key: z.string(),
  channel: z.string(),
  status: z.string(),
  owner_user_id: z.string().nullable(),
  tags: z.array(z.string()),
  sentiment: z.string().nullable(),
  sla_due_at: z.string().nullable(),
  last_message_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  sla: z.object({
    breached: z.boolean(),
    due_in_seconds: z.number().nullable(),
  }),
})

export type UniboxConversationPublic = z.infer<typeof uniboxConversationPublicSchema>
