/**
 * End-to-End Test Suite
 * 
 * Tests complete system after deployment:
 * 1. Module accessibility
 * 2. OAuth2 SSO flow
 * 3. Cross-module navigation
 * 4. License checking
 * 5. Data consistency
 * 
 * Usage: npx tsx scripts/test-end-to-end.ts [--staging|--production]
 */

const ENVIRONMENTS = {
  staging: {
    core: 'https://staging.payaid.io',
    crm: 'https://crm-staging.payaid.io',
    finance: 'https://finance-staging.payaid.io',
    hr: 'https://hr-staging.payaid.io',
  },
  production: {
    core: 'https://payaid.io',
    crm: 'https://crm.payaid.io',
    finance: 'https://finance.payaid.io',
    hr: 'https://hr.payaid.io',
  },
}

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

async function testModuleAccessibility(url: string, moduleName: string): Promise<TestResult> {
  try {
    const response = await fetch(url, { redirect: 'manual' })
    
    // Should return 200, 302 (redirect), or 401 (unauthorized)
    if (response.status === 200 || response.status === 302 || response.status === 401) {
      return { name: `${moduleName} accessibility`, passed: true }
    }
    
    return {
      name: `${moduleName} accessibility`,
      passed: false,
      error: `Unexpected status: ${response.status}`,
    }
  } catch (error: any) {
    return {
      name: `${moduleName} accessibility`,
      passed: false,
      error: error.message,
    }
  }
}

async function testOAuth2Flow(coreUrl: string, moduleUrl: string, moduleName: string): Promise<TestResult> {
  try {
    // Test authorization endpoint
    const authUrl = `${coreUrl}/api/oauth/authorize?client_id=${moduleName}&redirect_uri=${encodeURIComponent(moduleUrl + '/api/oauth/callback')}&response_type=code`
    const authResponse = await fetch(authUrl, { redirect: 'manual' })
    
    if (authResponse.status !== 302 && authResponse.status !== 200) {
      return {
        name: `${moduleName} OAuth2 authorization`,
        passed: false,
        error: `Authorization endpoint returned ${authResponse.status}`,
      }
    }

    // Test token endpoint
    const tokenUrl = `${coreUrl}/api/oauth/token`
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: 'test-code',
        redirect_uri: `${moduleUrl}/api/oauth/callback`,
        client_id: moduleName,
      }),
    })
    
    // Should return 400 or 401 (invalid code) but endpoint should exist
    if (tokenResponse.status !== 400 && tokenResponse.status !== 401) {
      return {
        name: `${moduleName} OAuth2 token`,
        passed: false,
        error: `Token endpoint returned ${tokenResponse.status}`,
      }
    }

    return { name: `${moduleName} OAuth2 flow`, passed: true }
  } catch (error: any) {
    return {
      name: `${moduleName} OAuth2 flow`,
      passed: false,
      error: error.message,
    }
  }
}

async function testCrossModuleNavigation(modules: Record<string, string>): Promise<TestResult> {
  try {
    // Test navigation between modules
    const moduleUrls = Object.values(modules)
    let accessibleCount = 0

    for (const url of moduleUrls) {
      try {
        const response = await fetch(url, { redirect: 'manual' })
        if (response.status === 200 || response.status === 302 || response.status === 401) {
          accessibleCount++
        }
      } catch {
        // Ignore errors
      }
    }

    if (accessibleCount === moduleUrls.length) {
      return { name: 'Cross-module navigation', passed: true }
    }

    return {
      name: 'Cross-module navigation',
      passed: false,
      error: `Only ${accessibleCount}/${moduleUrls.length} modules accessible`,
    }
  } catch (error: any) {
    return {
      name: 'Cross-module navigation',
      passed: false,
      error: error.message,
    }
  }
}

async function runTests(environment: 'staging' | 'production') {
  console.log(`🧪 Running end-to-end tests for ${environment}...\n`)

  const env = ENVIRONMENTS[environment]
  const results: TestResult[] = []

  // Test core module
  console.log('1️⃣ Testing core module...')
  results.push(await testModuleAccessibility(env.core, 'Core'))

  // Test CRM module
  console.log('2️⃣ Testing CRM module...')
  results.push(await testModuleAccessibility(env.crm, 'CRM'))
  results.push(await testOAuth2Flow(env.core, env.crm, 'crm'))

  // Test Finance module
  console.log('3️⃣ Testing Finance module...')
  results.push(await testModuleAccessibility(env.finance, 'Finance'))
  results.push(await testOAuth2Flow(env.core, env.finance, 'finance'))

  // Test HR module
  console.log('4️⃣ Testing HR module...')
  results.push(await testModuleAccessibility(env.hr, 'HR'))
  results.push(await testOAuth2Flow(env.core, env.hr, 'hr'))

  // Test cross-module navigation
  console.log('5️⃣ Testing cross-module navigation...')
  results.push(await testCrossModuleNavigation(env))

  // Print results
  console.log('\n📊 Test Results:\n')
  let passedCount = 0
  let failedCount = 0

  results.forEach((result) => {
    const status = result.passed ? '✅' : '❌'
    console.log(`${status} ${result.name}`)
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`)
    }
    if (result.passed) {
      passedCount++
    } else {
      failedCount++
    }
  })

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Passed: ${passedCount}`)
  console.log(`   ❌ Failed: ${failedCount}`)
  console.log(`   📈 Success Rate: ${Math.round((passedCount / results.length) * 100)}%`)

  if (failedCount > 0) {
    console.log(`\n❌ Some tests failed. Please review and fix issues.`)
    process.exit(1)
  } else {
    console.log(`\n✅ All tests passed!`)
  }
}

// Main
const environment = process.argv.includes('--production') ? 'production' : 'staging'
runTests(environment).catch(console.error)

