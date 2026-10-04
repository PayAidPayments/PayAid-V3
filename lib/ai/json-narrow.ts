/**
 * Shared narrowing helpers for unknown JSON / request bodies (BD-06).
 * Prefer these over per-route casts when a value is still `unknown`
 * after parse (e.g. Prisma Json, loosely typed payloads).
 */

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonArray
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]

export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export function asNumber(value: unknown, fallback?: number): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

export function asBoolean(value: unknown, fallback?: boolean): boolean | undefined {
  if (typeof value === 'boolean') return value
  return fallback
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback?: T
): T | undefined {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T
  }
  return fallback
}

/**
 * Prisma InputJsonValue-safe narrow (rejects functions / undefined).
 * Recursively strips non-JSON values so nested blobs assign cleanly.
 * Compound typeof checks on `unknown` do not narrow in all TS versions —
 * branch primitives separately before returning.
 */
export function asInputJsonValue(value: unknown): JsonValue {
  if (value === null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    return value.map((item) => asInputJsonValue(item))
  }
  if (typeof value === 'object') {
    const out: JsonObject = {}
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested === undefined) continue
      out[key] = asInputJsonValue(nested)
    }
    return out
  }
  return null
}
