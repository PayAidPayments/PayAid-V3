/**
 * Phase 10: Feature flags – env JSON or defaults. Use for A/B or turning modules off (e.g. Voice off for risky demos).
 * Set FEATURE_FLAGS in env: JSON object e.g. {"voice_agents":true,"ai_studio":true,"crm":true}.
 */

export type FeatureFlags = Record<string, boolean>

const DEFAULTS: FeatureFlags = {
  crm: true,
  hr: true,
  voice_agents: true,
  ai_studio: true,
  dashboard: true,
}

let cached: FeatureFlags | null = null

function parseFlags(): FeatureFlags {
  if (cached) return cached
  const raw = typeof process !== 'undefined' && process.env.FEATURE_FLAGS
  if (raw && typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const flags: FeatureFlags = {}
      for (const [k, v] of Object.entries(parsed)) {
        flags[k] = Boolean(v)
      }
      cached = { ...DEFAULTS, ...flags }
      return cached!
    } catch {
      cached = { ...DEFAULTS }
      return cached
    }
  }
  cached = { ...DEFAULTS }
  return cached
}

/**
 * Get all feature flags (from env FEATURE_FLAGS JSON or defaults).
 */
export function getFeatureFlags(): FeatureFlags {
  return parseFlags()
}

/**
 * Check if a feature flag is enabled.
 */
export function isFeatureEnabled(flag: string): boolean {
  return parseFlags()[flag] !== false
}

/**
 * Reset cached flags (e.g. in tests).
 */
export function resetFeatureFlags(): void {
  cached = null
}
