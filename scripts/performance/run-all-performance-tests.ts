/**
 * Master script to execute all performance testing scripts
 * This completes the "Performance Testing" execution tasks
 * 
 * Usage: npx tsx scripts/performance/run-all-performance-tests.ts
 * 
 * Note: Load testing requires a running application instance
 */

import { execSync } from 'child_process'
import { join } from 'path'

const scripts = [
  {
    name: 'Database Optimization',
    path: 'scripts/performance/optimize-database.ts',
    description: 'Add indexes and optimize database queries',
    required: true,
  },
  {
    name: 'Load Testing',
    path: 'scripts/performance/load-test.ts',
    description: 'Run load tests (1000+ contacts, 500+ deals)',
    required: false, // Requires running app instance
  },
]

async function runAllPerformanceTests() {
  console.log('🚀 Running all performance testing scripts...\n')

  const results: Array<{ name: string; success: boolean; error?: string; skipped?: boolean }> = []

  for (const script of scripts) {
    console.log(`📦 Running: ${script.name}`)
    console.log(`   ${script.description}`)

    // Check if app is running for load testing
    if (script.name === 'Load Testing') {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const skipLoadTest = process.env.SKIP_LOAD_TEST === 'true'
      
      if (skipLoadTest) {
        console.log(`⏭️  Load testing skipped (SKIP_LOAD_TEST=true)\n`)
        results.push({ name: script.name, success: false, skipped: true })
        continue
      }
      
      console.log(`   Note: Ensure app is running at ${appUrl} before load testing`)
      console.log(`   Set SKIP_LOAD_TEST=true to skip load testing\n`)
    }

    try {
      execSync(`npx tsx ${script.path}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
      console.log(`✅ ${script.name} completed successfully\n`)
      results.push({ name: script.name, success: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ ${script.name} failed: ${errorMessage}\n`)
      results.push({ name: script.name, success: false, error: errorMessage })
    }
  }

  // Summary
  console.log('\n📊 Performance Testing Summary:')
  console.log('='.repeat(50))
  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success && !r.skipped).length
  const skipped = results.filter((r) => r.skipped).length

  results.forEach((result) => {
    if (result.skipped) {
      console.log(`⏭️  ${result.name} (skipped)`)
    } else {
      const status = result.success ? '✅' : '❌'
      console.log(`${status} ${result.name}`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    }
  })

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Successful: ${successful}/${scripts.length}`)
  if (skipped > 0) {
    console.log(`⏭️  Skipped: ${skipped}/${scripts.length}`)
  }
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}/${scripts.length}`)
  }

  if (failed === 0) {
    console.log('\n🎉 All performance testing scripts completed!')
    if (skipped > 0) {
      console.log('\nNote: Some tests were skipped. To run them:')
      console.log('1. Start your application server')
      console.log('2. Set NEXT_PUBLIC_APP_URL environment variable')
      console.log('3. Run this script again')
    }
  } else {
    console.log('\n⚠️  Some tests failed. Please review errors above.')
    process.exit(1)
  }
}

runAllPerformanceTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
