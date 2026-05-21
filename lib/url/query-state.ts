/**
 * Shared URL query helpers for dashboard client pages.
 */

export function buildQueryStringWithUpdates(
  base: string,
  updates: Record<string, string | null | undefined>
): string {
  const trimmed = base.trim()
  const qs = trimmed.startsWith('?') ? trimmed.slice(1) : trimmed
  const params = new URLSearchParams(qs)
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
  }
  const out = params.toString()
  return out ? `?${out}` : ''
}
