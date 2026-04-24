const BASE_URL = process.env.WEBSITE_BUILDER_BASE_URL || ''
const LOGIN_EMAIL = process.env.WEBSITE_BUILDER_LOGIN_EMAIL || ''
const LOGIN_PASSWORD = process.env.WEBSITE_BUILDER_LOGIN_PASSWORD || ''

function fail(message) {
  console.error(message)
  process.exitCode = 1
}

if (!BASE_URL) {
  fail('WEBSITE_BUILDER_BASE_URL is required')
} else if (!LOGIN_EMAIL) {
  fail('WEBSITE_BUILDER_LOGIN_EMAIL is required')
} else if (!LOGIN_PASSWORD) {
  fail('WEBSITE_BUILDER_LOGIN_PASSWORD is required')
} else {
  const endpoint = `${BASE_URL.replace(/\/$/, '')}/api/auth/login`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    }),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    fail(
      `Token fetch failed (status ${response.status}): ${
        body?.error || body?.message || 'unknown login error'
      }`
    )
  } else {
    const token = body?.token
    if (!token || typeof token !== 'string') {
      fail('Login response did not include token')
    } else {
      const tenantId = body?.user?.tenantId || body?.tenant?.id || '[unknown-tenant]'
      const lines = [
        '# Website Builder Step 4.8 token helper output',
        '',
        `# base: ${BASE_URL}`,
        `# tenantId: ${tenantId}`,
        '',
        '$env:WEBSITE_BUILDER_BASE_URL="' + BASE_URL + '"',
        '$env:WEBSITE_BUILDER_AUTH_TOKEN="' + token + '"',
        '',
        '# Optional one-command pipeline',
        'npm run run:website-builder-step4-8-evidence-pipeline',
      ]
      console.log(lines.join('\n'))
      process.exitCode = 0
    }
  }
}
