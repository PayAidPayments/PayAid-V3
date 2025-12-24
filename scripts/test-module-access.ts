/**
 * Module Access Integration Test Script
 * 
 * Tests module licensing and access control
 * 
 * Usage: npx tsx scripts/test-module-access.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

interface TestResult {
  name: string
  success: boolean
  error?: string
}

const results: TestResult[] = []

async function test(name: string, testFn: () => Promise<void>): Promise<void> {
  try {
    await testFn()
    results.push({ name, success: true })
    console.log(`✅ ${name}`)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    results.push({ name, success: false, error: errorMsg })
    console.error(`❌ ${name}: ${errorMsg}`)
  }
}

async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`)
  }

  const { token } = await response.json()
  if (!token) {
    throw new Error('No token received')
  }

  return token
}

async function testCRMWithLicense() {
  const token = await login('admin@demo.com', 'Test@1234')

  // Test accessing CRM route with license
  const response = await fetch(`${BASE_URL}/api/contacts`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`CRM access failed: ${error.error || response.statusText}`)
  }
}

async function testCRMWithoutLicense() {
  // This would require a tenant without CRM license
  // For now, we'll test that the endpoint requires authentication
  const response = await fetch(`${BASE_URL}/api/contacts`)

  if (response.ok) {
    throw new Error('Should require authentication')
  }

  if (response.status !== 401) {
    throw new Error(`Expected 401, got ${response.status}`)
  }
}

async function testInvoicingWithLicense() {
  const token = await login('admin@demo.com', 'Test@1234')

  const response = await fetch(`${BASE_URL}/api/invoices`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Invoicing access failed: ${error.error || response.statusText}`)
  }
}

async function testHRWithLicense() {
  const token = await login('admin@demo.com', 'Test@1234')

  const response = await fetch(`${BASE_URL}/api/hr/employees`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`HR access failed: ${error.error || response.statusText}`)
  }
}

async function testWhatsAppWithLicense() {
  const token = await login('admin@demo.com', 'Test@1234')

  const response = await fetch(`${BASE_URL}/api/whatsapp/accounts`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`WhatsApp access failed: ${error.error || response.statusText}`)
  }
}

async function testAccountingWithLicense() {
  const token = await login('admin@demo.com', 'Test@1234')

  const response = await fetch(`${BASE_URL}/api/accounting/expenses`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Accounting access failed: ${error.error || response.statusText}`)
  }
}

async function main() {
  console.log('🧪 Starting Module Access Integration Tests\n')
  console.log(`Base URL: ${BASE_URL}\n`)

  await test('CRM Access with License', testCRMWithLicense)
  await test('CRM Access without Auth', testCRMWithoutLicense)
  await test('Invoicing Access with License', testInvoicingWithLicense)
  await test('HR Access with License', testHRWithLicense)
  await test('WhatsApp Access with License', testWhatsAppWithLicense)
  await test('Accounting Access with License', testAccountingWithLicense)

  console.log('\n📊 Test Results:')
  console.log('─'.repeat(60))
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌'
    console.log(`${icon} ${result.name}`)
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('─'.repeat(60))
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`)

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch(console.error)

