/**
 * Build next query string by applying key/value updates.
 * - `null`/empty string removes key.
 * - other values set/replace key.
 */
export function buildQueryStringWithUpdates(
  current: string,
  updates: Record<string, string | null | undefined>
): string {
  const q = new URLSearchParams(current)
  for (const [k, v] of Object.entries(updates)) {
    if (v === null || v === undefined || v === '') q.delete(k)
    else q.set(k, v)
  }
  return q.toString()
}

