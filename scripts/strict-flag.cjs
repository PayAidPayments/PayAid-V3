/**
 * CJS wrapper for strict env-flag parsing.
 * Keep behavior aligned with scripts/strict-flag.mjs.
 */
function isStrictFlagEnabled(flagValue, options = {}) {
  if (flagValue === '1') return true
  if (options.allowTrueString && flagValue === 'true') return true
  return false
}

module.exports = {
  isStrictFlagEnabled,
}
