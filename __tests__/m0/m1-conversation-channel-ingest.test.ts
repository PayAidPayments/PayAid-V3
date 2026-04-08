import { describe, expect, it } from '@jest/globals'
import { conversationIngestSchema } from '@/lib/ai-native/m1-conversations'

const CHANNELS = ['email', 'whatsapp', 'sms', 'web', 'phone', 'in_app'] as const

describe('ConversationIngest — channel coverage (contract reliability)', () => {
  it.each(CHANNELS)('accepts channel %s', (channel) => {
    const parsed = conversationIngestSchema.safeParse({
      tenant_id: 'tn_1',
      conversation_id: 'thread_1',
      channel,
      direction: 'inbound',
      body: 'Hello',
      occurred_at: '2026-04-07T12:00:00.000Z',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.channel).toBe(channel)
  })
})
