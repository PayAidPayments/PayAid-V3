export function parseTimeoutMs(value, fallbackMs) {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackMs
  return parsed
}

export function resolveTimeoutMs({
  env = process.env,
  globalKey,
  specificKey,
  fallbackMs = 300000,
}) {
  const globalTimeoutMs = parseTimeoutMs(env[globalKey], fallbackMs)
  if (!specificKey) return globalTimeoutMs
  return parseTimeoutMs(env[specificKey], globalTimeoutMs)
}

export function enrichTimeoutResult({
  label,
  timeoutMs,
  status,
  error,
  stderr = '',
}) {
  const timedOut = error?.name === 'Error' && error?.code === 'ETIMEDOUT'
  const timeoutSuffix = timedOut ? `Step "${label}" timed out after ${timeoutMs}ms.` : ''
  const mergedStderr = [stderr.trim(), timeoutSuffix].filter(Boolean).join('\n')
  return {
    timedOut,
    timeoutMs,
    exitCode: status ?? 1,
    stderr: mergedStderr,
  }
}

