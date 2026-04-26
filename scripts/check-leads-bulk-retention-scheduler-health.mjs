import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const BASE_URL = (process.env.LEADS_BULK_RETENTION_HEALTH_BASE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '')
const TENANT_ID = process.env.LEADS_BULK_RETENTION_HEALTH_TENANT_ID?.trim() || ''
const STALE_AFTER_MINUTES = Number(process.env.LEADS_BULK_RETENTION_HEALTH_STALE_AFTER_MINUTES || 180)
const RUNNING_MAX_MINUTES = Number(process.env.LEADS_BULK_RETENTION_HEALTH_RUNNING_MAX_MINUTES || 180)
const SKIP_WARN_COUNT = Number(process.env.LEADS_BULK_RETENTION_HEALTH_SKIP_WARN_COUNT || 3)
const FETCH_TIMEOUT_MS = Number(process.env.LEADS_BULK_RETENTION_HEALTH_FETCH_TIMEOUT_MS || 20000)
const USE_LOCAL_FALLBACK = process.env.LEADS_BULK_RETENTION_HEALTH_USE_LOCAL_FALLBACK !== '0'

const lockRoot = path.join(process.cwd(), '.tmp', 'locks')
const lockPath = path.join(lockRoot, 'leads-bulk-report-retention.lock.json')
const statusPath = path.join(lockRoot, 'leads-bulk-report-retention.status.json')

function fail(message, details = {}) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        check: 'leads-bulk-retention-scheduler-health',
        message,
        ...details,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

function asError(error) {
  if (error instanceof Error) {
    return error
  }
  return new Error(String(error))
}

function toConnectivityHint(endpoint) {
  return [
    `Verify the app serving ${endpoint} is running and reachable.`,
    'If this endpoint is in the leads app, ensure `apps/leads` is running on the expected port.',
    `Local fallback is ${USE_LOCAL_FALLBACK ? 'enabled' : 'disabled'} via LEADS_BULK_RETENTION_HEALTH_USE_LOCAL_FALLBACK.`,
    'You can tune timeout via LEADS_BULK_RETENTION_HEALTH_FETCH_TIMEOUT_MS.',
  ]
}

function readJsonSafe(filePath) {
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function minutesSince(isoValue) {
  const ms = Date.parse(String(isoValue ?? ''))
  if (!Number.isFinite(ms)) return null
  return Math.max(0, Math.round((Date.now() - ms) / 60000))
}

async function evaluateLocalHealth(tenantId) {
  const lock = readJsonSafe(lockPath)
  const status = readJsonSafe(statusPath)
  const statusAgeMinutes = minutesSince(status?.updatedAt)
  const runningForMinutes = minutesSince(status?.startedAt)
  const state = String(status?.state ?? 'unknown')
  const reasons = []
  let severity = 'healthy'

  if (!status) {
    severity = 'warning'
    reasons.push('scheduler_status_missing')
  }
  if (statusAgeMinutes !== null && statusAgeMinutes > STALE_AFTER_MINUTES) {
    severity = severity === 'critical' ? 'critical' : 'warning'
    reasons.push('status_stale')
  }
  if (state === 'running' && runningForMinutes !== null && runningForMinutes > RUNNING_MAX_MINUTES) {
    severity = 'critical'
    reasons.push('running_too_long')
  }
  if (state === 'failed') {
    severity = 'critical'
    reasons.push('last_run_failed')
  }

  const consecutiveSkipped = Number(status?.consecutiveSkipped ?? 0)
  if (consecutiveSkipped >= SKIP_WARN_COUNT) {
    severity = severity === 'critical' ? 'critical' : 'warning'
    reasons.push('repeated_skips')
  }

  return {
    ok: severity === 'healthy',
    check: 'leads-bulk-retention-scheduler-health',
    endpoint: 'local-fallback',
    severity,
    reasons,
    metrics: {
      statusAgeMinutes,
      runningForMinutes,
      consecutiveSkipped,
      state,
      hasActiveLock: Boolean(lock),
      tenantId,
    },
    evaluatedAt: new Date().toISOString(),
    source: 'local-fallback',
  }
}

if (!TENANT_ID) {
  fail('Missing LEADS_BULK_RETENTION_HEALTH_TENANT_ID')
}

if (!Number.isFinite(FETCH_TIMEOUT_MS) || FETCH_TIMEOUT_MS < 1000) {
  fail('Invalid LEADS_BULK_RETENTION_HEALTH_FETCH_TIMEOUT_MS', {
    received: process.env.LEADS_BULK_RETENTION_HEALTH_FETCH_TIMEOUT_MS ?? null,
    minimumMs: 1000,
  })
}

const query = new URLSearchParams({
  tenantId: TENANT_ID,
  staleAfterMinutes: String(STALE_AFTER_MINUTES),
  runningMaxMinutes: String(RUNNING_MAX_MINUTES),
  skipWarnCount: String(SKIP_WARN_COUNT),
})

const endpoint = `${BASE_URL}/api/activation/bulk-reports/scheduler-status?${query.toString()}`

const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(new Error(`Timed out after ${FETCH_TIMEOUT_MS}ms`)), FETCH_TIMEOUT_MS)

async function runRemoteCheck() {
  const response = await fetch(endpoint, { signal: controller.signal })
  clearTimeout(timeout)
  const body = await response.json()
  if (!response.ok) {
    fail('Scheduler status endpoint returned non-200 response', {
      endpoint,
      status: response.status,
      body,
    })
  }

  const health = body?.scheduler?.health
  if (!health) {
    fail('Scheduler health payload missing', { endpoint, body })
  }

  const output = {
    ok: Boolean(health.ok),
    check: 'leads-bulk-retention-scheduler-health',
    endpoint,
    severity: health.severity,
    reasons: Array.isArray(health.reasons) ? health.reasons : [],
    metrics: health.metrics || {},
    evaluatedAt: health.evaluatedAt || new Date().toISOString(),
  }

  console.log(JSON.stringify(output, null, 2))
  if (!output.ok) {
    process.exit(1)
  }
}

try {
  await runRemoteCheck()
} catch (error) {
  clearTimeout(timeout)
  const normalizedError = asError(error)
  const timeoutOrConnectFailure =
    normalizedError.name === 'AbortError' ||
    /timed out/i.test(normalizedError.message) ||
    /fetch failed/i.test(normalizedError.message)

  if (USE_LOCAL_FALLBACK && timeoutOrConnectFailure) {
    try {
      const fallback = await evaluateLocalHealth(TENANT_ID)
      console.log(JSON.stringify(fallback, null, 2))
      if (!fallback.ok) {
        process.exit(1)
      }
      process.exit(0)
    } catch (fallbackError) {
      const normalizedFallbackError = asError(fallbackError)
      fail('Scheduler health check request failed and local fallback failed', {
        endpoint,
        fetchTimeoutMs: FETCH_TIMEOUT_MS,
        errorName: normalizedError.name,
        error: normalizedError.message,
        fallbackErrorName: normalizedFallbackError.name,
        fallbackError: normalizedFallbackError.message,
        hint: toConnectivityHint(endpoint),
      })
    }
  } else {
    fail('Scheduler health check request failed', {
      endpoint,
      fetchTimeoutMs: FETCH_TIMEOUT_MS,
      errorName: normalizedError.name,
      error: normalizedError.message,
      hint: timeoutOrConnectFailure ? toConnectivityHint(endpoint) : undefined,
    })
  }
}
