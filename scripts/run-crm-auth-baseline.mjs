import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const now = new Date()
const iso = now.toISOString()
const stamp = iso.replace(/[:.]/g, '-')

const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const email = process.env.CRM_LOGIN_EMAIL || 'businessadmin@demobusiness.com'
const password = process.env.CRM_LOGIN_PASSWORD || 'BusinessAdmin_2025!'
const sampleCount = Number(process.env.CRM_AUTH_SAMPLE_COUNT || '5')
const requestTimeoutMs = Number(process.env.CRM_AUTH_SAMPLE_TIMEOUT_MS || '120000')
const loginTimeoutMs = Number(process.env.CRM_AUTH_LOGIN_TIMEOUT_MS || '60000')
const maxHealthAttempts = Number(process.env.CRM_AUTH_HEALTH_ATTEMPTS || '3')
const maxLoginAttempts = Number(process.env.CRM_AUTH_LOGIN_ATTEMPTS || '3')
const maxSampleAttempts = Number(process.env.CRM_AUTH_SAMPLE_ATTEMPTS || '2')

function writeArtifact(payload) {
  const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${stamp}-crm-auth-baseline-run.md`)
  const lines = []
  lines.push('# CRM Auth Baseline Run')
  lines.push('')
  lines.push(`- Timestamp: ${payload.timestamp}`)
  lines.push(`- BASE_URL: ${payload.baseUrl}`)
  lines.push(`- Login email: ${payload.email}`)
  lines.push(`- Status: ${payload.status}`)
  lines.push(`- Reason: ${payload.reason || 'none'}`)
  if (payload.tenantId) lines.push(`- Tenant ID: ${payload.tenantId}`)
  lines.push(`- Sample count: ${payload.sampleCount}`)
  lines.push(`- Request timeout ms: ${payload.requestTimeoutMs}`)
  lines.push('')
  lines.push('## Raw JSON')
  lines.push('')
  lines.push('```json')
  lines.push(JSON.stringify(payload, null, 2))
  lines.push('```')
  lines.push('')
  writeFileSync(outputPath, lines.join('\n'), 'utf8')
  return outputPath
}

async function checkHealth(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const res = await fetch(`${url}/api/auth/login`, {
      method: 'GET',
      signal: controller.signal,
    })
    // Some environments may return 401/403 on GET /api/auth/login but still be reachable.
    return { ok: res.status < 500, status: res.status }
  } catch (error) {
    return { ok: false, error: String(error?.message || error) }
  } finally {
    clearTimeout(timeout)
  }
}

async function loginAndGetToken(url, emailValue, passwordValue) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), loginTimeoutMs)
  try {
    const response = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailValue, password: passwordValue }),
      signal: controller.signal,
    })
    const json = await response.json().catch(() => ({}))
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        reason: json?.message || json?.error || 'Login failed',
      }
    }
    return {
      ok: true,
      token: json?.token || '',
      tenantId: json?.tenant?.id || '',
    }
  } catch (error) {
    return { ok: false, reason: String(error?.message || error) }
  } finally {
    clearTimeout(timeout)
  }
}

function percentile(sorted, p) {
  const idx = Math.ceil(p * sorted.length) - 1
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))]
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithTiming(url, headers) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)
  const start = performance.now()
  try {
    const response = await fetch(url, { headers, signal: controller.signal })
    await response.arrayBuffer()
    const elapsed = performance.now() - start
    return { ok: response.ok, status: response.status, elapsedMs: elapsed, error: '' }
  } catch (error) {
    return { ok: false, status: 0, elapsedMs: performance.now() - start, error: String(error?.message || error) }
  } finally {
    clearTimeout(timeout)
  }
}

async function sampleEndpoint(url, headers, samples, attempts) {
  const attemptLogs = []
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const times = []
    let firstStatus = 0
    let failed = false
    let error = ''
    for (let i = 0; i < samples; i += 1) {
      const result = await fetchWithTiming(url, headers)
      if (i === 0) firstStatus = result.status
      if (!result.ok) {
        failed = true
        error = result.error || `HTTP ${result.status}`
        break
      }
      times.push(result.elapsedMs)
    }
    attemptLogs.push({ attempt, firstStatus, failed, error, collected: times.length })
    if (!failed && times.length > 0) {
      times.sort((a, b) => a - b)
      return {
        ok: true,
        firstStatus,
        p50_ms: Math.round(percentile(times, 0.5)),
        p95_ms: Math.round(percentile(times, 0.95)),
        p99_ms: Math.round(percentile(times, 0.99)),
        min_ms: Math.round(times[0]),
        max_ms: Math.round(times[times.length - 1]),
        attempts: attemptLogs,
      }
    }
    await sleep(1200 * attempt)
  }
  return { ok: false, firstStatus: 0, attempts: attemptLogs }
}

async function runInlineSampler(url, tenantId, token) {
  const enc = encodeURIComponent(tenantId)
  const headers = { Authorization: `Bearer ${token}` }
  const routes = {
    contacts: `${url}/api/contacts?tenantId=${enc}&limit=50`,
    deals: `${url}/api/deals?tenantId=${enc}&limit=50`,
    tasks: `${url}/api/tasks?tenantId=${enc}&limit=50&stats=false`,
    tasksFallback: `${url}/api/crm/tasks?tenantId=${enc}&limit=50&stats=false`,
  }
  const contacts = await sampleEndpoint(routes.contacts, headers, sampleCount, maxSampleAttempts)
  const deals = await sampleEndpoint(routes.deals, headers, sampleCount, maxSampleAttempts)
  let tasks = await sampleEndpoint(routes.tasks, headers, sampleCount, maxSampleAttempts)
  let tasksRouteUsed = routes.tasks
  let tasksFallbackAttempt = null
  if (!tasks.ok) {
    const got404 = (tasks.attempts || []).some((attempt) => attempt.firstStatus === 404)
    if (got404) {
      const fallbackResult = await sampleEndpoint(routes.tasksFallback, headers, sampleCount, maxSampleAttempts)
      tasksFallbackAttempt = fallbackResult
      tasks = fallbackResult
      tasksRouteUsed = routes.tasksFallback
      if (fallbackResult.ok) {
        // keep fallback selection when it works
      }
    }
  }
  return { contacts, deals, tasks, tasksRouteUsed, tasksFallbackAttempt, routes }
}

;(async () => {
  const payload = {
    timestamp: iso,
    baseUrl,
    email,
    status: 'blocked',
    reason: '',
    tenantId: '',
    sampleCount,
    requestTimeoutMs,
    healthAttempts: [],
    loginAttempts: [],
    sampler: null,
  }

  let healthy = false
  for (let i = 1; i <= maxHealthAttempts; i += 1) {
    const health = await checkHealth(baseUrl)
    payload.healthAttempts.push({ attempt: i, ...health })
    if (health.ok) {
      healthy = true
      break
    }
    await sleep(1000 * i)
  }
  if (!healthy) {
    const lastHealth = payload.healthAttempts[payload.healthAttempts.length - 1] || {}
    payload.reason = lastHealth.error || `Login endpoint health check failed (status ${lastHealth.status ?? 'unknown'})`
    const outputPath = writeArtifact(payload)
    console.log(JSON.stringify({ ...payload, outputPath }, null, 2))
    process.exit(1)
  }

  let loginResult = null
  for (let i = 1; i <= maxLoginAttempts; i += 1) {
    const result = await loginAndGetToken(baseUrl, email, password)
    payload.loginAttempts.push({ attempt: i, ...result, token: undefined })
    if (result.ok) {
      loginResult = result
      break
    }
    await sleep(1500 * i)
  }
  if (!loginResult || !loginResult.ok) {
    const lastLogin = payload.loginAttempts[payload.loginAttempts.length - 1] || {}
    payload.reason = lastLogin.reason || `Login failed with status ${lastLogin.status ?? 'unknown'}`
    const outputPath = writeArtifact(payload)
    console.log(JSON.stringify({ ...payload, outputPath }, null, 2))
    process.exit(1)
  }

  payload.tenantId = loginResult.tenantId
  if (!payload.tenantId || !loginResult.token) {
    payload.reason = 'Login succeeded but token/tenantId missing in response'
    const outputPath = writeArtifact(payload)
    console.log(JSON.stringify({ ...payload, outputPath }, null, 2))
    process.exit(1)
  }

  payload.sampler = await runInlineSampler(baseUrl, payload.tenantId, loginResult.token)
  const samplerOk =
    payload.sampler.contacts?.ok &&
    payload.sampler.deals?.ok &&
    payload.sampler.tasks?.ok

  if (samplerOk) {
    payload.status = 'pass'
    payload.reason = ''
  } else {
    payload.status = 'blocked'
    payload.reason = 'Inline auth sampler failed for one or more endpoints'
  }

  const outputPath = writeArtifact(payload)
  console.log(JSON.stringify({ ...payload, outputPath }, null, 2))
  process.exit(payload.status === 'pass' ? 0 : 1)
})()
