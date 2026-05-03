import { describe, expect, it } from '@jest/globals'
import {
  conversationAssignSchema,
  conversationIngestSchema,
  conversationReplySchema,
  conversationTagSchema,
  uniboxMessagePublicSchema,
  uniboxConversationPublicSchema,
} from '@/lib/ai-native/m1-conversations'

describe('M1 ConversationIngest contract', () => {
  it('accepts a valid payload with defaults', () => {
    const parsed = conversationIngestSchema.parse({
      tenant_id: 'tn_1',
      conversation_id: 'thread_abc',
      channel: 'email',
      direction: 'inbound',
      body: 'Hello, I need pricing',
      occurred_at: '2026-04-07T12:00:00.000Z',
      customer_ref: { entity_type: 'contact', entity_id: 'c1' },
    })
    expect(parsed.schema_version).toBe('1.0')
    expect(parsed.metadata).toEqual({})
  })

  it('rejects empty body', () => {
    expect(() =>
      conversationIngestSchema.parse({
        tenant_id: 'tn_1',
        conversation_id: 'thread_abc',
        channel: 'web',
        direction: 'inbound',
        body: '',
        occurred_at: '2026-04-07T12:00:00.000Z',
      })
    ).toThrow()
  })

  it('accepts assign / reply / tag payloads', () => {
    expect(conversationAssignSchema.parse({ owner_user_id: 'usr_1' }).owner_user_id).toBe('usr_1')
    expect(conversationReplySchema.parse({ body: 'Thanks' }).body).toBe('Thanks')
    expect(conversationTagSchema.parse({ tags: ['a', 'b'] }).tags).toEqual(['a', 'b'])
  })

  it('accepts unibox message public shape', () => {
    const m = uniboxMessagePublicSchema.parse({
      id: 'm1',
      direction: 'inbound',
      body: 'Hi',
      occurred_at: '2026-04-07T12:00:00.000Z',
      metadata: null,
    })
    expect(m.id).toBe('m1')
  })

  it('accepts unibox conversation public detail', () => {
    const d = uniboxConversationPublicSchema.parse({
      schema_version: '1.0',
      id: 'c1',
      thread_key: 't1',
      channel: 'email',
      status: 'open',
      owner_user_id: 'u1',
      tags: [],
      sentiment: null,
      sla_due_at: '2026-04-08T12:00:00.000Z',
      last_message_at: '2026-04-07T12:00:00.000Z',
      created_at: '2026-04-06T12:00:00.000Z',
      updated_at: '2026-04-07T12:00:00.000Z',
      sla: { breached: false, due_in_seconds: 86400 },
    })
    expect(d.id).toBe('c1')
  })
})
