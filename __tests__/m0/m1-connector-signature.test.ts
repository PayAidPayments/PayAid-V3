/**
 * M1 connector signature — pure-logic tests for HMAC webhook verification.
 * No network or DB calls; fully deterministic.
 */
import { describe, expect, it } from '@jest/globals'
import {
  computeWebhookSignature,
  verifyWebhookSignature,
  parseWebhookTimestamp,
  DEFAULT_REPLAY_WINDOW_MS,
} from '@/lib/ai-native/m1-connector-signature'

const SECRET = 'test-secret-key'
const BODY = '{"tenant_id":"tn_1","channel":"whatsapp"}'

describe('computeWebhookSignature', () => {
  it('returns a 64-character hex string', () => {
    const ts = Date.now()
    const sig = computeWebhookSignature(SECRET, ts, BODY)
    expect(typeof sig).toBe('string')
    expect(sig).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic for the same inputs', () => {
    const ts = 1712570000000
    const sig1 = computeWebhookSignature(SECRET, ts, BODY)
    const sig2 = computeWebhookSignature(SECRET, ts, BODY)
    expect(sig1).toBe(sig2)
  })

  it('differs for different secrets', () => {
    const ts = 1712570000000
    expect(computeWebhookSignature('secret-a', ts, BODY)).not.toBe(
      computeWebhookSignature('secret-b', ts, BODY)
    )
  })

  it('differs for different timestamps', () => {
    expect(computeWebhookSignature(SECRET, 1000, BODY)).not.toBe(
      computeWebhookSignature(SECRET, 2000, BODY)
    )
  })

  it('differs for different body content', () => {
    expect(computeWebhookSignature(SECRET, 1000, '{"a":1}')).not.toBe(
      computeWebhookSignature(SECRET, 1000, '{"a":2}')
    )
  })
})

describe('verifyWebhookSignature', () => {
  it('returns valid:true for a correctly computed signature within window', () => {
    const ts = Date.now()
    const sig = computeWebhookSignature(SECRET, ts, BODY)
    const result = verifyWebhookSignature(SECRET, ts, BODY, sig)
    expect(result.valid).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('returns valid:false with reason=signature_mismatch for wrong signature', () => {
    const ts = Date.now()
    const wrongSig = 'a'.repeat(64)
    const result = verifyWebhookSignature(SECRET, ts, BODY, wrongSig)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('signature_mismatch')
  })

  it('returns valid:false with reason=stale_timestamp for old timestamp', () => {
    const staleTs = Date.now() - DEFAULT_REPLAY_WINDOW_MS - 1000
    const sig = computeWebhookSignature(SECRET, staleTs, BODY)
    const result = verifyWebhookSignature(SECRET, staleTs, BODY, sig)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('stale_timestamp')
  })

  it('returns valid:false with reason=stale_timestamp for future timestamp beyond window', () => {
    const futureTs = Date.now() + DEFAULT_REPLAY_WINDOW_MS + 1000
    const sig = computeWebhookSignature(SECRET, futureTs, BODY)
    const result = verifyWebhookSignature(SECRET, futureTs, BODY, sig)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('stale_timestamp')
  })

  it('returns valid:false with reason=invalid_timestamp for NaN input', () => {
    const result = verifyWebhookSignature(SECRET, 'not-a-number', BODY, 'sig')
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('invalid_timestamp')
  })

  it('returns valid:false for mismatched signature length', () => {
    const ts = Date.now()
    const result = verifyWebhookSignature(SECRET, ts, BODY, 'short')
    expect(result.valid).toBe(false)
  })

  it('respects custom replay window', () => {
    const smallWindowMs = 1000 // 1 second
    const oldTs = Date.now() - 5000 // 5 seconds ago
    const sig = computeWebhookSignature(SECRET, oldTs, BODY)
    const result = verifyWebhookSignature(SECRET, oldTs, BODY, sig, smallWindowMs)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('stale_timestamp')
  })

  it('accepts timestamp at the edge of the replay window', () => {
    const edgeTs = Date.now() - DEFAULT_REPLAY_WINDOW_MS + 500 // just inside window
    const sig = computeWebhookSignature(SECRET, edgeTs, BODY)
    const result = verifyWebhookSignature(SECRET, edgeTs, BODY, sig)
    expect(result.valid).toBe(true)
  })
})

describe('parseWebhookTimestamp', () => {
  it('returns null for null input', () => {
    expect(parseWebhookTimestamp(null)).toBeNull()
  })

  it('returns null for non-numeric input', () => {
    expect(parseWebhookTimestamp('abc')).toBeNull()
  })

  it('converts 10-digit seconds to ms', () => {
    const secs = Math.floor(Date.now() / 1000)
    const result = parseWebhookTimestamp(String(secs))
    expect(result).toBe(secs * 1000)
  })

  it('returns 13-digit ms value as-is', () => {
    const ms = Date.now()
    const result = parseWebhookTimestamp(String(ms))
    expect(result).toBe(ms)
  })
})
