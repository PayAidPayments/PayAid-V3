const MULTISPACE_RE = /\s+/g
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i
const PHONE_LIKE_RE = /^\+?[0-9][0-9\s\-()]{5,}$/
const ID_LIKE_RE = /^[a-zA-Z0-9_-]{6,}$/

export function normalizeSearchQuery(input: string): string {
  return input.trim().replace(MULTISPACE_RE, ' ')
}

export function isExactLookupQuery(query: string): boolean {
  if (!query) return false
  if (EMAIL_RE.test(query)) return true
  if (PHONE_LIKE_RE.test(query)) return true
  return ID_LIKE_RE.test(query)
}

export function shouldRunServerSearch(query: string, minChars = 2): boolean {
  if (!query) return false
  if (isExactLookupQuery(query)) return true
  return query.length >= minChars
}

