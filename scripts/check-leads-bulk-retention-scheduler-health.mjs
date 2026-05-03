const BASE_URL = (process.env.LEADS_BULK_RETENTION_HEALTH_BASE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '')
const TENANT_ID = process.env.LEADS_BULK_RETENTION_HEALTH_TENANT_ID?.trim() || ''
const STALE_AFTER_MINUTES = Number(process.env.LEADS_BULK_RETENTION_HEALTH_STALE_AFTER_MINUTES || 180)
const RUNNING_MAX_MINUTES = Number(process.env.LEADS_BULK_RETENTION_HEALTH_RUNNING_MAX_MINUTES || 180)
const SKIP_WARN_COUNT = Number(process.env.LEADS_BULK_RETENTION_HEALTH_SKIP_WARN_COUNT || 3)
const FETCH_TIMEOUT_MS = Number(process.env.LEADS_BULK_RETENTION_HEALTH_FETCH_TIMEOUT_MS || 20000)

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
    'You can tune timeout via LEADS_BULK_RETENTION_HEALTH_FETCH_TIMEOUT_MS.',
  ]
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

try {
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
} catch (error) {
  clearTimeout(timeout)
  const normalizedError = asError(error)
  const timeoutOrConnectFailure =
    normalizedError.name === 'AbortError' ||
    /timed out/i.test(normalizedError.message) ||
    /fetch failed/i.test(normalizedError.message)

  fail('Scheduler health check request failed', {
    endpoint,
    fetchTimeoutMs: FETCH_TIMEOUT_MS,
    errorName: normalizedError.name,
    error: normalizedError.message,
    hint: timeoutOrConnectFailure ? toConnectivityHint(endpoint) : undefined,
  })
}
