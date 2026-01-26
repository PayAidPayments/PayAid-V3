/**
 * Financial Dashboard API Endpoint Testing Script
 * 
 * Tests all financial dashboard API endpoints after deployment
 * Run this after Steps 1-5 are completed
 * 
 * Usage:
 *   npx tsx scripts/test-financial-api-endpoints.ts [tenantId]
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const API_BASE = `${BASE_URL}/api/v1/financials`

interface TestResult {
  endpoint: string
  method: string
  status: 'pass' | 'fail' | 'skip'
  responseTime?: number
  error?: string
  statusCode?: number
}

const results: TestResult[] = []

async function testEndpoint(
  name: string,
  method: 'GET' | 'POST',
  url: string,
  body?: any,
  headers?: Record<string, string>
): Promise<TestResult> {
  const startTime = Date.now()
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    if (body && method === 'POST') {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)
    const responseTime = Date.now() - startTime
    const data = await response.json()

    return {
      endpoint: name,
      method,
      status: response.ok ? 'pass' : 'fail',
      responseTime,
      statusCode: response.status,
      error: response.ok ? undefined : data.error || `HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      endpoint: name,
      method,
      status: 'fail',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function getAuthToken(tenantId: string): Promise<string | null> {
  try {
    // Get first admin user for the tenant
    const user = await prisma.user.findFirst({
      where: {
        tenantId,
        role: { in: ['admin', 'owner'] },
      },
    })

    if (!user) {
      console.warn(`No admin user found for tenant ${tenantId}`)
      return null
    }

    // In production, you'd need to actually login to get a token
    // For testing, you might need to use a test token or skip auth
    console.log(`Found user: ${user.email} for tenant ${tenantId}`)
    return null // Return null to test without auth (endpoints should handle this)
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

async function runTests(tenantId?: string) {
  console.log('🧪 Financial Dashboard API Endpoint Testing\n')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`API Base: ${API_BASE}\n`)

  if (!tenantId) {
    // Get first tenant
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.error('❌ No tenants found in database')
      return
    }
    tenantId = tenant.id
    console.log(`Using tenant: ${tenant.name} (${tenantId})\n`)
  }

  const headers: Record<string, string> = {}
  const token = await getAuthToken(tenantId)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Test 1: Dashboard Snapshot
  console.log('1. Testing Dashboard Snapshot...')
  results.push(
    await testEndpoint(
      'Dashboard Snapshot',
      'GET',
      `${API_BASE}/dashboard?tenantId=${tenantId}`,
      undefined,
      headers
    )
  )

  // Test 2: P&L for Date Range
  console.log('2. Testing P&L for Date Range...')
  const currentYear = new Date().getFullYear()
  results.push(
    await testEndpoint(
      'P&L Date Range',
      'GET',
      `${API_BASE}/p-and-l?startDate=${currentYear}-01-01&endDate=${currentYear}-12-31&tenantId=${tenantId}`,
      undefined,
      headers
    )
  )

  // Test 3: P&L Trend
  console.log('3. Testing P&L Trend...')
  results.push(
    await testEndpoint(
      'P&L Trend',
      'GET',
      `${API_BASE}/p-and-l/trend/${currentYear}?tenantId=${tenantId}`,
      undefined,
      headers
    )
  )

  // Test 4: Cash Flow Daily
  console.log('4. Testing Cash Flow Daily...')
  results.push(
    await testEndpoint(
      'Cash Flow Daily',
      'GET',
      `${API_BASE}/cash-flow/daily?startDate=${currentYear}-01-01&endDate=${currentYear}-12-31&tenantId=${tenantId}`,
      undefined,
      headers
    )
  )

  // Test 5: Cash Flow Forecast
  console.log('5. Testing Cash Flow Forecast...')
  results.push(
    await testEndpoint(
      'Cash Flow Forecast',
      'GET',
      `${API_BASE}/cash-flow/forecast?days=30&tenantId=${tenantId}`,
      undefined,
      headers
    )
  )

  // Test 6: Cash Position
  console.log('6. Testing Cash Position...')
  results.push(
    await testEndpoint(
      'Cash Position',
      'GET',
      `${API_BASE}/cash-flow/position?tenantId=${tenantId}`,
      undefined,
      headers
    )
  )

  // Test 7: Working Capital
  console.log('7. Testing Working Capital...')
  results.push(
    await testEndpoint(
      'Working Capital',
      'GET',
      `${API_BASE}/cash-flow/working-capital?tenantId=${tenantId}`,
      undefined,
      headers
    )
  )

  // Test 8: Cash Conversion Cycle
  console.log('8. Testing Cash Conversion Cycle...')
  results.push(
    await testEndpoint(
      'Cash Conversion Cycle',
      'GET',
      `${API_BASE}/cash-flow/ccc?tenantId=${tenantId}`,
      undefined,
      headers
    )
  )

  // Test 9: Variance Analysis
  console.log('9. Testing Variance Analysis...')
  results.push(
    await testEndpoint(
      'Variance Analysis',
      'GET',
      `${API_BASE}/variance/${currentYear}/1?tenantId=${tenantId}`,
      undefined,
      headers
    )
  )

  // Test 10: Alerts
  console.log('10. Testing Alerts...')
  results.push(
    await testEndpoint(
      'Alerts',
      'GET',
      `${API_BASE}/alerts?tenantId=${tenantId}`,
      undefined,
      headers
    )
  )

  // Test 11: Alert Check
  console.log('11. Testing Alert Check...')
  results.push(
    await testEndpoint(
      'Alert Check',
      'POST',
      `${API_BASE}/alerts/check?tenantId=${tenantId}`,
      {},
      headers
    )
  )

  // Test 12: Alert Logs
  console.log('12. Testing Alert Logs...')
  results.push(
    await testEndpoint(
      'Alert Logs',
      'GET',
      `${API_BASE}/alerts/logs?tenantId=${tenantId}`,
      undefined,
      headers
    )
  )

  // Test 13: Sync
  console.log('13. Testing Sync...')
  results.push(
    await testEndpoint(
      'Sync',
      'POST',
      `${API_BASE}/sync?tenantId=${tenantId}`,
      {},
      headers
    )
  )

  // Print Results
  console.log('\n📊 Test Results:\n')
  console.log('─'.repeat(80))

  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  const skipped = results.filter((r) => r.status === 'skip').length

  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
    const time = result.responseTime ? `${result.responseTime}ms` : 'N/A'
    const status = result.statusCode ? ` (${result.statusCode})` : ''
    console.log(
      `${icon} ${result.method.padEnd(4)} ${result.endpoint.padEnd(30)} ${time.padStart(8)}${status}`
    )
    if (result.error) {
      console.log(`   └─ Error: ${result.error}`)
    }
  })

  console.log('─'.repeat(80))
  console.log(`\n✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`\nTotal: ${results.length} tests`)

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check the errors above.')
    process.exit(1)
  } else {
    console.log('\n🎉 All tests passed!')
    process.exit(0)
  }
}

// Run tests
const tenantId = process.argv[2]
runTests(tenantId)
  .catch((error) => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
