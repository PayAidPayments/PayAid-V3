/**
 * In-memory cache for Twilio playback: callSid -> audio buffer.
 * TTL 5 minutes so we don't leak memory; Twilio fetches immediately after we return TwiML.
 */

const CACHE_TTL_MS = 5 * 60 * 1000

type Entry = { buffer: Buffer; at: number }

const cache = new Map<string, Entry>()

function prune() {
  const now = Date.now()
  for (const [k, v] of cache.entries()) {
    if (now - v.at > CACHE_TTL_MS) cache.delete(k)
  }
}

export function setPlayback(callSid: string, buffer: Buffer): void {
  prune()
  cache.set(callSid, { buffer, at: Date.now() })
}

export function getPlayback(callSid: string): Buffer | null {
  const e = cache.get(callSid)
  if (!e) return null
  if (Date.now() - e.at > CACHE_TTL_MS) {
    cache.delete(callSid)
    return null
  }
  return e.buffer
}
