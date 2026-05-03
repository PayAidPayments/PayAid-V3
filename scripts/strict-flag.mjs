/**
 * Shared parser for strict env-flag toggles used by automation/gate scripts.
 *
 * Conventions:
 * - "1" enables strict mode.
 * - Any other value is treated as disabled.
 * - Some legacy callers may explicitly opt into "true" compatibility.
 *
 * Reference:
 * - docs/WEBSITE_BUILDER_STEP4_8_RUNTIME_RUNBOOK.md (strict env-flag convention)
 */
export function isStrictFlagEnabled(flagValue, options = {}) {
  if (flagValue === '1') return true
  if (options.allowTrueString && flagValue === 'true') return true
  return false
}
