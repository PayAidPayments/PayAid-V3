import { createHmac, timingSafeEqual } from 'crypto'

/** Signature algorithm used for all PayAid connector webhooks. */
export const WEBHOOK_SIG_ALGORITHM = 'sha256'

/** Default replay window — reject events older than 5 minutes. */
export const DEFAULT_REPLAY_WINDOW_MS = 5 * 60 * 1000

/**
 * Compute an HMAC-SHA256 signature for a webhook delivery.
 * Follows the `${timestamp}.${rawBody}` signing scheme (same as Stripe / SendGrid).
 */
export function computeWebhookSignature(secret: string, timestamp: number | string, rawBody: string): string {
  const sigPayload = `${timestamp}.${rawBody}`
  return createHmac(WEBHOOK_SIG_ALGORITHM, secret).update(sigPayload, 'utf8').digest('hex')
}

/**
 * Verify an incoming webhook signature in constant time.
 * Returns `true` only when the signature matches AND the timestamp is within the replay window.
 */
export function verifyWebhookSignature(
  secret: string,
  timestamp: number | string,
  rawBody: string,
  receivedSig: string,
  replayWindowMs = DEFAULT_REPLAY_WINDOW_MS
): { valid: boolean; reason?: string } {
  const ts = Number(timestamp)
  if (isNaN(ts) || ts <= 0) {
    return { valid: false, reason: 'invalid_timestamp' }
  }

  const age = Date.now() - ts
  if (age < 0 || age > replayWindowMs) {
    return { valid: false, reason: 'stale_timestamp' }
  }

  let expected: Buffer
  try {
    expected = Buffer.from(computeWebhookSignature(secret, timestamp, rawBody), 'hex')
  } catch {
    return { valid: false, reason: 'signature_compute_error' }
  }

  let received: Buffer
  try {
    received = Buffer.from(receivedSig, 'hex')
  } catch {
    return { valid: false, reason: 'invalid_signature_format' }
  }

  if (expected.length !== received.length) {
    return { valid: false, reason: 'signature_mismatch' }
  }

  const match = timingSafeEqual(expected, received)
  return match ? { valid: true } : { valid: false, reason: 'signature_mismatch' }
}

/**
 * Parse the `X-Webhook-Timestamp` header value to a unix-millisecond integer.
 * Accepts both ms and s epoch values (auto-detected by magnitude).
 */
export function parseWebhookTimestamp(raw: string | null): number | null {
  if (!raw) return null
  const n = Number(raw)
  if (isNaN(n) || n <= 0) return null
  // If value looks like seconds (10-digit), convert to ms
  return n < 1e12 ? n * 1000 : n
}
