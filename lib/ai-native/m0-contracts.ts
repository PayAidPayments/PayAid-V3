import { z } from 'zod'

export const signalEventSchema = z.object({
  schema_version: z.string().default('1.0'),
  tenant_id: z.string().min(1),
  event_id: z.string().min(1),
  source: z.enum(['crm', 'web', 'email', 'manual', 'api']),
  event_type: z.string().min(1),
  entity_type: z.enum(['lead', 'contact', 'deal', 'account']),
  entity_id: z.string().min(1),
  occurred_at: z.string().datetime(),
  confidence: z.number().min(0).max(1).optional(),
  intent_score: z.number().min(0).max(100).optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  trace_id: z.string().min(1).optional(),
})

export const workflowConditionSchema = z.object({
  field: z.string().min(1),
  op: z.enum(['=', '!=', '>', '>=', '<', '<=', 'contains']),
  value: z.union([z.string(), z.number(), z.boolean()]),
})

export const workflowActionSchema = z.object({
  type: z.string().min(1),
  params: z.record(z.string(), z.unknown()).default({}),
})

export const workflowDefinitionSchema = z.object({
  schema_version: z.string().default('1.0'),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'paused']).default('draft'),
  trigger: z.object({
    event_type: z.string().min(1),
  }),
  conditions: z.array(workflowConditionSchema).default([]),
  actions: z.array(workflowActionSchema).min(1),
  safety: z
    .object({
      cooldown_minutes: z.number().int().min(0).default(0),
      max_actions_per_day: z.number().int().min(1).default(3),
    })
    .default({ cooldown_minutes: 0, max_actions_per_day: 3 }),
})

export const sequenceStepSchema = z.object({
  step_no: z.number().int().min(1),
  channel: z.enum(['email', 'task']),
  template_id: z.string().min(1),
  delay_minutes: z.number().int().min(0).default(0),
  stop_if: z.array(z.string()).default([]),
})

export const sequenceDefinitionSchema = z.object({
  schema_version: z.string().default('1.0'),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'paused']).default('draft'),
  steps: z.array(sequenceStepSchema).min(1),
})

export const actionExecutionSchema = z.object({
  schema_version: z.string().default('1.0'),
  tenant_id: z.string().min(1),
  action_execution_id: z.string().min(1),
  workflow_id: z.string().min(1).optional(),
  sequence_id: z.string().min(1).optional(),
  trace_id: z.string().min(1),
  action_type: z.string().min(1),
  attempt: z.number().int().min(1),
  max_retries: z.number().int().min(0),
  status: z.enum(['queued', 'running', 'succeeded', 'failed', 'dlq']),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
  started_at: z.string().datetime().optional(),
  finished_at: z.string().datetime().optional(),
  outcome: z.record(z.string(), z.unknown()).default({}),
})

export type SignalEvent = z.infer<typeof signalEventSchema>
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>
export type SequenceDefinition = z.infer<typeof sequenceDefinitionSchema>
export type ActionExecution = z.infer<typeof actionExecutionSchema>
