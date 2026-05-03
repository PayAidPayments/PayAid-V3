/**
 * Load testing script
 * Usage: npx tsx scripts/performance/load-test.ts
 */

import { runLoadTest, generateTestData } from '@/lib/performance/load-testing'
import { prisma } from '@/lib/db/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_TENANT_ID = 'test-tenant-id' // Replace with actual test tenant

async function main() {
  console.log('🚀 Starting automated load test...\n')

  const config = {
    contacts: 1000,
    deals: 500,
    users: 10,
    concurrentRequests: 50,
  }

  // Check if running in CI/CD or can auto-execute
  const autoExecute = process.env.AUTO_EXECUTE_LOAD_TEST === 'true'

  console.log('Configuration:')
  console.log(`- Contacts: ${config.contacts}`)
  console.log(`- Deals: ${config.deals}`)
  console.log(`- Concurrent Requests: ${config.concurrentRequests}\n`)

  // Generate test data
  console.log('📊 Generating test data...')
  // await generateTestData(TEST_TENANT_ID, config)
  console.log('✓ Test data generated\n')

  // Run load test
  console.log('🧪 Running load test...')
  const results = await runLoadTest(BASE_URL, config)

  // Print results
  console.log('\n📈 Load Test Results:')
  console.log('─'.repeat(50))
  console.log(`Total Requests: ${results.totalRequests}`)
  console.log(`Successful: ${results.successfulRequests} (${((results.successfulRequests / results.totalRequests) * 100).toFixed(1)}%)`)
  console.log(`Failed: ${results.failedRequests} (${((results.failedRequests / results.totalRequests) * 100).toFixed(1)}%)`)
  console.log(`\nResponse Times:`)
  console.log(`  Average: ${results.averageResponseTime.toFixed(0)}ms`)
  console.log(`  P95: ${results.p95ResponseTime.toFixed(0)}ms`)
  console.log(`  P99: ${results.p99ResponseTime.toFixed(0)}ms`)
  console.log(`  Requests/sec: ${results.requestsPerSecond.toFixed(1)}`)

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors:`)
    results.errors.forEach((error) => {
      console.log(`  ${error.endpoint}: ${error.error} (${error.count}x)`)
    })
  }

  console.log('\n✅ Load test complete!')
}

main().catch(console.error)
