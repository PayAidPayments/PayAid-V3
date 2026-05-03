const BASE_URL = process.env.CANONICAL_STAGING_BASE_URL || 'https://payaid-v3.vercel.app'
const LOGIN_EMAIL = process.env.CANONICAL_STAGING_LOGIN_EMAIL || ''
const LOGIN_PASSWORD = process.env.CANONICAL_STAGING_LOGIN_PASSWORD || ''

if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        message:
          'Missing login credentials. Set CANONICAL_STAGING_LOGIN_EMAIL and CANONICAL_STAGING_LOGIN_PASSWORD.',
        example: {
          CANONICAL_STAGING_BASE_URL: BASE_URL,
          CANONICAL_STAGING_LOGIN_EMAIL: 'admin@demo.com',
          CANONICAL_STAGING_LOGIN_PASSWORD: '[password]',
        },
      },
      null,
      2
    )
  )
  process.exit(1)
}

try {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    }),
  })

  const body = await res.json().catch(() => ({}))
  const token =
    body?.token ||
    body?.accessToken ||
    body?.jwt ||
    body?.data?.token ||
    body?.user?.token ||
    ''

  if (!res.ok || !token) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          status: res.status,
          message: 'Login failed or token missing in response payload.',
          responseKeys: body && typeof body === 'object' ? Object.keys(body) : [],
        },
        null,
        2
      )
    )
    process.exit(1)
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl: BASE_URL,
        tokenLength: token.length,
        exports: {
          CANONICAL_STAGING_BASE_URL: BASE_URL,
          CANONICAL_STAGING_AUTH_TOKEN: token,
        },
        powershell: [
          `$env:CANONICAL_STAGING_BASE_URL="${BASE_URL}"`,
          `$env:CANONICAL_STAGING_AUTH_TOKEN="${token}"`,
        ],
      },
      null,
      2
    )
  )
} catch (error) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        message: 'Network or runtime error during login.',
        error: String(error?.message || error),
      },
      null,
      2
    )
  )
  process.exit(1)
}
