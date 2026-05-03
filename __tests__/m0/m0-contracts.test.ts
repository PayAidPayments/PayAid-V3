import { describe, expect, it } from '@jest/globals'
import {
  actionExecutionSchema,
  sequenceDefinitionSchema,
  signalEventSchema,
  workflowDefinitionSchema,
} from '@/lib/ai-native/m0-contracts'

describe('M0 contracts', () => {
  it('accepts a valid SignalEvent and applies schema_version default', () => {
    const parsed = signalEventSchema.parse({
      tenant_id: 'tn_123',
      event_id: 'evt_1',
      source: 'manual',
      event_type: 'lead.intent_detected',
      entity_type: 'lead',
      entity_id: 'lead_1',
      occurred_at: '2026-04-06T10:20:00.000Z',
      intent_score: 72,
      confidence: 0.82,
      payload: { status: 'new' },
    })

    expect(parsed.schema_version).toBe('1.0')
    expect(parsed.intent_score).toBe(72)
  })

  it('rejects SignalEvent with invalid intent_score', () => {
    expect(() =>
      signalEventSchema.parse({
        tenant_id: 'tn_123',
        event_id: 'evt_1',
        source: 'manual',
        event_type: 'lead.intent_detected',
        entity_type: 'lead',
        entity_id: 'lead_1',
        occurred_at: '2026-04-06T10:20:00.000Z',
        intent_score: 120,
        payload: {},
      })
    ).toThrow()
  })

  it('accepts a valid WorkflowDefinition with safety defaults', () => {
    const parsed = workflowDefinitionSchema.parse({
      name: 'High intent follow-up',
      trigger: { event_type: 'lead.intent_detected' },
      actions: [{ type: 'task.create', params: { title: 'Call in 2h' } }],
    })

    expect(parsed.schema_version).toBe('1.0')
    expect(parsed.safety.max_actions_per_day).toBe(3)
    expect(parsed.conditions).toEqual([])
  })

  it('accepts a valid SequenceDefinition with ordered steps', () => {
    const parsed = sequenceDefinitionSchema.parse({
      name: 'Prospect sequence',
      steps: [
        { step_no: 1, channel: 'email', template_id: 'intro_01' },
        { step_no: 2, channel: 'task', template_id: 'call_01', delay_minutes: 120 },
      ],
    })

    expect(parsed.schema_version).toBe('1.0')
    expect(parsed.steps).toHaveLength(2)
    expect(parsed.steps[0].step_no).toBe(1)
  })

  it('accepts a valid ActionExecution with retry metadata', () => {
    const parsed = actionExecutionSchema.parse({
      tenant_id: 'tn_123',
      action_execution_id: 'ax_1',
      workflow_id: 'wf_1',
      trace_id: 'trace_1',
      action_type: 'task.create',
      attempt: 2,
      max_retries: 3,
      status: 'failed',
      error_code: 'QUEUE_TIMEOUT',
      error_message: 'Timed out waiting for worker',
      started_at: '2026-04-06T10:20:00.000Z',
      finished_at: '2026-04-06T10:21:00.000Z',
      outcome: { retriable: true },
    })

    expect(parsed.schema_version).toBe('1.0')
    expect(parsed.attempt).toBe(2)
    expect(parsed.max_retries).toBe(3)
    expect(parsed.trace_id).toBe('trace_1')
  })
})
