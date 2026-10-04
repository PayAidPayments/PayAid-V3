/**
 * AI runtime circuit breakers — rate limits, anomaly flags, emergency kill switches.
 */

type Bucket = { count: number; resetAt: number; toolBurst: number }

function isStrictFlagEnabled(flagValue: string | undefined): boolean {
  return flagValue === '1'
}

const requestBuckets = new Map<string, Bucket>()
const ANOMALY_TOOL_BURST = Number(process.env.AI_TOOL_BURST_THRESHOLD || '25')
const WINDOW_MS = Number(process.env.AI_RATE_WINDOW_MS || '60_000')
const MAX_REQUESTS = Number(process.env.AI_RATE_LIMIT_PER_TENANT || '120')

export function isToolKillSwitchActive(env: NodeJS.ProcessEnv = process.env): boolean {
  return isStrictFlagEnabled(env.AI_TOOL_KILL_SWITCH)
}

export function checkAiRateLimit(tenantId: string, surface: string): {
  allowed: boolean
  retryAfterSeconds?: number
  anomalyDetected?: boolean
} {
  const now = Date.now()
  const key = `${tenantId}:${surface}`
  const bucket = requestBuckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS, toolBurst: 0 })
    return { allowed: true }
  }

  if (bucket.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }

  bucket.count += 1
  requestBuckets.set(key, bucket)
  return { allowed: true }
}

export function recordToolInvocation(tenantId: string): { anomalyDetected: boolean } {
  const now = Date.now()
  const key = `${tenantId}:tools`
  const bucket = requestBuckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, { count: 0, resetAt: now + WINDOW_MS, toolBurst: 1 })
    return { anomalyDetected: false }
  }

  bucket.toolBurst += 1
  requestBuckets.set(key, bucket)
  return { anomalyDetected: bucket.toolBurst >= ANOMALY_TOOL_BURST }
}
