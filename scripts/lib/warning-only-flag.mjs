export function resolveWarningOnlyFlag({
  env = process.env,
  specificKey,
  umbrellaKey = 'MARKETING_RELEASE_GATE_EVIDENCE_WARNING_ONLY',
}) {
  if (specificKey) {
    if (env[specificKey] === '1') return true
    if (env[specificKey] === '0') return false
  }
  return env[umbrellaKey] === '1'
}

