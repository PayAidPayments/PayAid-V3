/**
 * Pure sensitive-field redaction (no Prisma / Next imports).
 * Prefer this from AI audit/trace paths to avoid DB init during tests/CLI.
 */

const SENSITIVE_KEY_PATTERN = /(password|secret|token|authorization|api[_-]?key|credential)/i

export function redactSensitive<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item)) as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : redactSensitive(child)
    }
    return out as T
  }
  if (typeof value === 'string' && value.length > 2048) {
    return `${value.slice(0, 2048)}...[truncated]` as T
  }
  return value
}
