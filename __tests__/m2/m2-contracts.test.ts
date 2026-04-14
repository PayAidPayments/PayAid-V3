import { describe, expect, it } from '@jest/globals'
import {
  marketplaceAppSchema,
  callLogSchema,
  callTranscriptSchema,
  quoteContractSchema,
  sdrRunSchema,
  sdrPlaybookBodySchema,
  sdrGuardrailsSchema,
} from '@/lib/ai-native/m2-contracts'

describe('M2.2 Data Contracts — MarketplaceApp', () => {
  const validApp = {
    schema_version: '1.0' as const,
    id: 'app_1',
    name: 'Webhook Connector',
    description: 'Connect to webhooks',
    category: 'integrations',
    status: 'available' as const,
    permissions: ['read:contacts', 'write:deals'],
    event_subscriptions: ['deal.created', 'contact.updated'],
    plan: 'free' as const,
    version: '1.2.0',
    install_count: 42,
  }

  it('validates a complete app record', () => {
    expect(() => marketplaceAppSchema.parse(validApp)).not.toThrow()
  })

  it('rejects invalid status', () => {
    expect(() =>
      marketplaceAppSchema.parse({ ...validApp, status: 'unknown' })
    ).toThrow()
  })

  it('rejects negative install_count', () => {
    expect(() =>
      marketplaceAppSchema.parse({ ...validApp, install_count: -1 })
    ).toThrow()
  })
})

describe('M2.2 Data Contracts — CallLog', () => {
  const validCall = {
    schema_version: '1.0' as const,
    id: 'call_1',
    tenant_id: 'tn_m2',
    direction: 'outbound' as const,
    status: 'completed' as const,
    from_number: '+919876543210',
    to_number: '+911234567890',
    duration_seconds: 180,
    started_at: '2026-04-08T10:00:00.000Z',
    ended_at: '2026-04-08T10:03:00.000Z',
    summary: 'Discussed Q2 proposal',
  }

  it('validates a complete call log', () => {
    expect(() => callLogSchema.parse(validCall)).not.toThrow()
  })

  it('accepts call without optional fields', () => {
    const minimal = {
      schema_version: '1.0' as const,
      id: 'call_2',
      tenant_id: 'tn_m2',
      direction: 'inbound' as const,
      status: 'failed' as const,
      from_number: '+911111111111',
      to_number: '+922222222222',
      started_at: '2026-04-08T10:00:00.000Z',
    }
    expect(() => callLogSchema.parse(minimal)).not.toThrow()
  })

  it('rejects invalid direction', () => {
    expect(() => callLogSchema.parse({ ...validCall, direction: 'sideways' })).toThrow()
  })
})

describe('M2.2 Data Contracts — CallTranscript', () => {
  const validTranscript = {
    schema_version: '1.0' as const,
    id: 'tr_1',
    call_id: 'call_1',
    language: 'en',
    created_at: '2026-04-08T10:05:00.000Z',
    segments: [
      { speaker: 'agent' as const, text: 'Hello!', start_ms: 0, end_ms: 1500, confidence: 0.97, redacted: false },
      { speaker: 'customer' as const, text: 'Hi there.', start_ms: 1600, end_ms: 3200, confidence: 0.93, redacted: false },
    ],
  }

  it('validates a complete transcript', () => {
    expect(() => callTranscriptSchema.parse(validTranscript)).not.toThrow()
  })

  it('accepts redacted segment', () => {
    const withRedact = {
      ...validTranscript,
      segments: [{ ...validTranscript.segments[0], redacted: true }],
    }
    expect(() => callTranscriptSchema.parse(withRedact)).not.toThrow()
  })

  it('rejects confidence out of range', () => {
    expect(() =>
      callTranscriptSchema.parse({
        ...validTranscript,
        segments: [{ ...validTranscript.segments[0], confidence: 1.5 }],
      })
    ).toThrow()
  })
})

describe('M2.2 Data Contracts — Quote', () => {
  const validQuote = {
    schema_version: '1.0' as const,
    id: 'q_1',
    tenant_id: 'tn_m2',
    deal_id: 'd_1',
    quote_number: 'Q-2026-001',
    status: 'accepted' as const,
    requires_approval: false,
    line_items: [
      {
        id: 'li_1',
        name: 'Implementation',
        quantity: 1,
        unit_price: 100000,
        tax_rate: 0.18,
        discount_rate: 0,
        total: 118000,
      },
    ],
    subtotal: 100000,
    tax: 18000,
    discount: 0,
    total: 118000,
  }

  it('validates an accepted quote', () => {
    expect(() => quoteContractSchema.parse(validQuote)).not.toThrow()
  })

  it('accepts quote with optional converted_to_invoice_id', () => {
    const converted = { ...validQuote, converted_to_invoice_id: 'inv_1', converted_at: '2026-04-08T00:00:00.000Z' }
    expect(() => quoteContractSchema.parse(converted)).not.toThrow()
  })

  it('rejects invalid status', () => {
    expect(() => quoteContractSchema.parse({ ...validQuote, status: 'won' })).toThrow()
  })

  it('rejects negative unit_price', () => {
    const badLi = { ...validQuote.line_items[0], unit_price: -500 }
    expect(() => quoteContractSchema.parse({ ...validQuote, line_items: [badLi] })).toThrow()
  })
})

describe('M2.2 Data Contracts — SdrRun', () => {
  const validRun = {
    schema_version: '1.0' as const,
    id: 'run_1',
    playbook_id: 'pb_1',
    tenant_id: 'tn_m2',
    status: 'running' as const,
    started_at: '2026-04-08T00:00:00.000Z',
  }

  it('validates a running SDR run', () => {
    expect(() => sdrRunSchema.parse(validRun)).not.toThrow()
  })

  it('validates a stopped run with reason and policy decisions', () => {
    const stopped = {
      ...validRun,
      status: 'stopped' as const,
      stop_reason: 'Manager override',
      stopped_at: '2026-04-08T02:00:00.000Z',
      policy_decisions: [
        {
          decision_type: 'manual_stop',
          outcome: 'blocked' as const,
          reason: 'Manager override',
          occurred_at: '2026-04-08T02:00:00.000Z',
        },
      ],
    }
    expect(() => sdrRunSchema.parse(stopped)).not.toThrow()
  })

  it('rejects invalid status', () => {
    expect(() => sdrRunSchema.parse({ ...validRun, status: 'active' })).toThrow()
  })
})

describe('M2.2 Data Contracts — SdrPlaybookBody', () => {
  it('validates a complete playbook body', () => {
    expect(() =>
      sdrPlaybookBodySchema.parse({
        name: 'Q2 Outreach',
        steps: [
          { step_type: 'email', delay_hours: 0, subject: 'Intro', body: 'Hi' },
          { step_type: 'call', delay_hours: 72 },
        ],
        guardrails: { max_contacts: 500, rate_limit_per_hour: 50, require_approval: false },
      })
    ).not.toThrow()
  })

  it('rejects empty steps array', () => {
    expect(() =>
      sdrPlaybookBodySchema.parse({ name: 'Empty', steps: [] })
    ).toThrow()
  })

  it('rejects invalid step_type', () => {
    expect(() =>
      sdrPlaybookBodySchema.parse({
        name: 'Bad',
        steps: [{ step_type: 'fax', delay_hours: 0 }],
      })
    ).toThrow()
  })
})

describe('M2.2 Data Contracts — SdrGuardrails', () => {
  it('validates complete guardrails', () => {
    expect(() =>
      sdrGuardrailsSchema.parse({
        max_contacts: 100,
        rate_limit_per_hour: 20,
        cooldown_hours: 48,
        require_approval: true,
        allowed_channels: ['email', 'phone'],
      })
    ).not.toThrow()
  })

  it('accepts empty guardrails (all optional)', () => {
    expect(() => sdrGuardrailsSchema.parse({})).not.toThrow()
  })

  it('rejects negative max_contacts', () => {
    expect(() => sdrGuardrailsSchema.parse({ max_contacts: -5 })).toThrow()
  })
})
