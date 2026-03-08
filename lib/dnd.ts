/**
 * TRAI DND (Do Not Disturb) check for Indian mobile numbers.
 * When DND_CHECK_URL is set, calls the configured API; otherwise returns false (non-DND) for dev.
 * Example: DND_CHECK_URL=https://example.com/dnd?mobile={phone}&key=YOUR_KEY
 * Or Manthan-style: http://manthanitsolutions.com/dnd/api/dnd_jsonapi.php?api_key=xx&pass=xx&mobile={phone}
 */

const DND_CHECK_URL = process.env.DND_CHECK_URL?.trim()
const DND_API_KEY = process.env.DND_API_KEY?.trim()

/** Normalize Indian phone to 10 digits for API (strip +91, 0, spaces). */
export function normalizePhoneForDnd(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

/**
 * Check if a number is DND. Returns true = DND (do not call), false = non-DND or unknown.
 * When DND_CHECK_URL is not set, returns false (treat as non-DND) so dev works without API.
 */
export async function checkDndStatus(phone: string): Promise<boolean> {
  const normalized = normalizePhoneForDnd(phone)
  if (!normalized || normalized.length < 10) return true // invalid = skip

  if (!DND_CHECK_URL) {
    return false // no API configured = assume non-DND
  }

  try {
    const url = DND_CHECK_URL.replace('{phone}', encodeURIComponent(normalized))
    const res = await fetch(url, {
      method: 'GET',
      headers: DND_API_KEY ? { Authorization: `Bearer ${DND_API_KEY}` } : {},
      signal: AbortSignal.timeout(5000),
    })
    const text = (await res.text()).toLowerCase()
    // Common patterns: "dnd", "yes", "1", "registered"
    if (text.includes('dnd') || text.includes('"status":"dnd"') || text.includes('"dnd":true')) return true
    if (text.includes('non-dnd') || text.includes('non dnd') || text.includes('"dnd":false')) return false
    // Manthan / custom: adapt as needed; default treat unknown as non-DND to avoid blocking
    return false
  } catch (e) {
    console.warn('[DND] Check failed for', normalized, e)
    return false
  }
}

/** Batch check; returns Map<normalizedPhone, isDnd>. */
export async function checkDndBatch(
  phones: string[],
  concurrency = 5
): Promise<Map<string, boolean>> {
  const normalized = [...new Set(phones.map(normalizePhoneForDnd).filter((p) => p.length >= 10))]
  const result = new Map<string, boolean>()
  for (let i = 0; i < normalized.length; i += concurrency) {
    const chunk = normalized.slice(i, i + concurrency)
    const outcomes = await Promise.all(chunk.map((p) => checkDndStatus(p)))
    chunk.forEach((p, j) => result.set(p, outcomes[j]))
  }
  return result
}
