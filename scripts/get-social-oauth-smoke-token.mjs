const BASE_URL = process.env.SOCIAL_SMOKE_BASE_URL || ''
const LOGIN_EMAIL = process.env.SOCIAL_SMOKE_LOGIN_EMAIL || ''
const LOGIN_PASSWORD = process.env.SOCIAL_SMOKE_LOGIN_PASSWORD || ''
const JSON_MODE = process.argv.includes('--json')

function buildRetrySteps(baseUrl) {
  return [
    '$env:SOCIAL_SMOKE_BASE_URL="' + baseUrl + '"',
    '$env:SOCIAL_SMOKE_LOGIN_EMAIL="<email>"',
    '$env:SOCIAL_SMOKE_LOGIN_PASSWORD="<password>"',
    'npm run get:social-oauth-smoke-token',
  ]
}

function printJson(payload) {
  console.log(JSON.stringify(payload, null, 2))
}

function exitFailure(message, { baseUrl = BASE_URL, status = null, code = 'TOKEN_FETCH_FAILED' } = {}) {
  const nextSteps = buildRetrySteps(baseUrl || 'http://127.0.0.1:3000')
  if (JSON_MODE) {
    printJson({
      ok: false,
      code,
      status,
      error: message,
      baseUrl: baseUrl || null,
      token: null,
      tenantId: null,
      nextSteps,
    })
  } else {
    console.error(message)
    console.error(['', '# Next steps', ...nextSteps].join('\n'))
  }
  process.exit(1)
}

if (!BASE_URL) exitFailure('SOCIAL_SMOKE_BASE_URL is required', { code: 'MISSING_BASE_URL' })
if (!LOGIN_EMAIL) exitFailure('SOCIAL_SMOKE_LOGIN_EMAIL is required', { code: 'MISSING_LOGIN_EMAIL' })
if (!LOGIN_PASSWORD) exitFailure('SOCIAL_SMOKE_LOGIN_PASSWORD is required', { code: 'MISSING_LOGIN_PASSWORD' })

let base
try {
  base = new URL(BASE_URL).toString().replace(/\/$/, '')
} catch {
  exitFailure(`SOCIAL_SMOKE_BASE_URL must be a valid absolute URL, received: ${BASE_URL}`, {
    code: 'INVALID_BASE_URL',
  })
}

const endpoint = `${base}/api/auth/login`
let response
try {
  response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    }),
  })
} catch (error) {
  exitFailure(`Token fetch failed before receiving a response: ${error instanceof Error ? error.message : 'unknown network error'}`, {
    baseUrl: base,
    code: 'NETWORK_FAILURE',
  })
}

const body = await response.json().catch(() => ({}))
if (!response.ok) {
  exitFailure(
    `Token fetch failed (status ${response.status}): ${body?.error || body?.message || 'unknown login error'}`,
    { baseUrl: base, status: response.status, code: 'LOGIN_FAILED' }
  )
}

const token = body?.token
if (!token || typeof token !== 'string') {
  exitFailure('Login response did not include token', {
    baseUrl: base,
    status: response.status,
    code: 'TOKEN_MISSING',
  })
}

const tenantId = body?.tenant?.id || '[unknown-tenant]'

if (JSON_MODE) {
  printJson({
    ok: true,
    code: 'TOKEN_READY',
    status: response.status,
    error: null,
    baseUrl: base,
    token,
    tenantId,
    nextSteps: [
      '$env:SOCIAL_SMOKE_BASE_URL="' + base + '"',
      '$env:SOCIAL_SMOKE_AUTH_TOKEN="' + token + '"',
      'npm run smoke:social-oauth-connectors',
    ],
  })
} else {
  console.log(
    [
      '# Social OAuth smoke token helper output',
      '',
      `# base: ${base}`,
      `# tenantId: ${tenantId}`,
      '',
      '$env:SOCIAL_SMOKE_BASE_URL="' + base + '"',
      '$env:SOCIAL_SMOKE_AUTH_TOKEN="' + token + '"',
      '',
      '# Optional full smoke',
      'npm run smoke:social-oauth-connectors',
    ].join('\n')
  )
}

