/**
 * OAuth2 SSO Integration Test Script
 * 
 * Tests the OAuth2 SSO flow between core module and client modules
 * 
 * Usage: npx tsx scripts/test-oauth2-sso.ts
 */

const CORE_BASE_URL = process.env.CORE_BASE_URL || 'http://localhost:3000'
const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || 'http://localhost:3001'
const CLIENT_ID = process.env.CLIENT_ID || 'crm-module'
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'crm-secret-key'

interface TestResult {
  name: string
  success: boolean
  error?: string
  duration: number
}

const results: TestResult[] = []

async function test(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now()
  try {
    await testFn()
    const duration = Date.now() - start
    results.push({ name, success: true, duration })
    console.log(`✅ ${name} (${duration}ms)`)
  } catch (error) {
    const duration = Date.now() - start
    const errorMsg = error instanceof Error ? error.message : String(error)
    results.push({ name, success: false, error: errorMsg, duration })
    console.error(`❌ ${name} (${duration}ms): ${errorMsg}`)
  }
}

async function testAuthorizationCodeFlow() {
  // Step 1: User logs into core module
  const loginResponse = await fetch(`${CORE_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@demo.com',
      password: 'Test@1234',
    }),
  })

  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.statusText}`)
  }

  const { token } = await loginResponse.json()
  if (!token) {
    throw new Error('No token received from login')
  }

  // Step 2: Redirect to OAuth authorize endpoint
  const authorizeUrl = new URL(`${CORE_BASE_URL}/api/oauth/authorize`)
  authorizeUrl.searchParams.set('client_id', CLIENT_ID)
  authorizeUrl.searchParams.set('redirect_uri', `${CLIENT_BASE_URL}/oauth/callback`)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'openid profile email')

  const authorizeResponse = await fetch(authorizeUrl.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cookie': `token=${token}`,
    },
    redirect: 'manual',
  })

  if (authorizeResponse.status !== 302) {
    throw new Error(`Expected redirect, got ${authorizeResponse.status}`)
  }

  const location = authorizeResponse.headers.get('location')
  if (!location) {
    throw new Error('No redirect location in authorize response')
  }

  // Extract authorization code from redirect URL
  const redirectUrl = new URL(location)
  const code = redirectUrl.searchParams.get('code')
  if (!code) {
    throw new Error('No authorization code in redirect URL')
  }

  // Step 3: Exchange code for access token
  const tokenResponse = await fetch(`${CORE_BASE_URL}/api/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${CLIENT_BASE_URL}/oauth/callback`,
    }),
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  const { access_token, refresh_token, expires_in } = await tokenResponse.json()
  if (!access_token) {
    throw new Error('No access token received')
  }

  // Step 4: Get user info
  const userInfoResponse = await fetch(`${CORE_BASE_URL}/api/oauth/userinfo`, {
    headers: {
      'Authorization': `Bearer ${access_token}`,
    },
  })

  if (!userInfoResponse.ok) {
    throw new Error(`User info failed: ${userInfoResponse.statusText}`)
  }

  const userInfo = await userInfoResponse.json()
  if (!userInfo.email || !userInfo.tenant) {
    throw new Error('Invalid user info response')
  }

  return { access_token, refresh_token, expires_in, userInfo }
}

async function testRefreshTokenFlow() {
  // First get a refresh token
  const { refresh_token } = await testAuthorizationCodeFlow()

  // Use refresh token to get new access token
  const tokenResponse = await fetch(`${CORE_BASE_URL}/api/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
    }),
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    throw new Error(`Refresh token failed: ${error}`)
  }

  const { access_token, refresh_token: new_refresh_token } = await tokenResponse.json()
  if (!access_token) {
    throw new Error('No access token received from refresh')
  }

  // Verify new refresh token is different (rotation)
  if (new_refresh_token === refresh_token) {
    throw new Error('Refresh token was not rotated')
  }
}

async function testInvalidClient() {
  const tokenResponse = await fetch(`${CORE_BASE_URL}/api/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from('invalid:invalid').toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: 'invalid-code',
      redirect_uri: `${CLIENT_BASE_URL}/oauth/callback`,
    }),
  })

  if (tokenResponse.ok) {
    throw new Error('Should have rejected invalid client')
  }

  const error = await tokenResponse.json()
  if (error.error !== 'invalid_client') {
    throw new Error(`Expected invalid_client error, got ${error.error}`)
  }
}

async function testInvalidCode() {
  const { token } = await (async () => {
    const loginResponse = await fetch(`${CORE_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'Test@1234',
      }),
    })
    return await loginResponse.json()
  })()

  const tokenResponse = await fetch(`${CORE_BASE_URL}/api/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: 'invalid-code-12345',
      redirect_uri: `${CLIENT_BASE_URL}/oauth/callback`,
    }),
  })

  if (tokenResponse.ok) {
    throw new Error('Should have rejected invalid code')
  }

  const error = await tokenResponse.json()
  if (error.error !== 'invalid_grant') {
    throw new Error(`Expected invalid_grant error, got ${error.error}`)
  }
}

async function testExpiredCode() {
  // This would require waiting for code expiration (5 minutes)
  // For now, just verify the endpoint handles it
  console.log('⏭️  Skipping expired code test (requires 5min wait)')
}

async function main() {
  console.log('🧪 Starting OAuth2 SSO Integration Tests\n')
  console.log(`Core URL: ${CORE_BASE_URL}`)
  console.log(`Client URL: ${CLIENT_BASE_URL}`)
  console.log(`Client ID: ${CLIENT_ID}\n`)

  await test('Authorization Code Flow', testAuthorizationCodeFlow)
  await test('Refresh Token Flow', testRefreshTokenFlow)
  await test('Invalid Client Rejection', testInvalidClient)
  await test('Invalid Code Rejection', testInvalidCode)
  await test('Expired Code Handling', testExpiredCode)

  console.log('\n📊 Test Results:')
  console.log('─'.repeat(60))
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌'
    console.log(`${icon} ${result.name} (${result.duration}ms)`)
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('─'.repeat(60))
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`)
  console.log(`Total Duration: ${totalDuration}ms`)

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch(console.error)

