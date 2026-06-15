/**
 * Unit tests for Bolna bridge tool policy helpers (draft-first naming).
 */

import { describe, it, expect } from '@jest/globals'
import { isDraftFirstToolName } from '@/lib/voice-agent/runtime/bolna-tool-policy'

describe('isDraftFirstToolName', () => {
  it('flags known payment tools', () => {
    expect(isDraftFirstToolName('send_payment_link')).toBe(true)
    expect(isDraftFirstToolName('refund_payment')).toBe(true)
  })

  it('flags payment-like names', () => {
    expect(isDraftFirstToolName('create_invoice_payment')).toBe(true)
  })

  it('allows safe tools', () => {
    expect(isDraftFirstToolName('ping')).toBe(false)
    expect(isDraftFirstToolName('schedule_callback')).toBe(false)
  })
})
