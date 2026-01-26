/**
 * Master script to execute all infrastructure setup scripts
 * This completes the "Technical Readiness" setup tasks
 * 
 * Usage: npx tsx scripts/infrastructure/run-all-setup.ts
 */

import { execSync } from 'child_process'
import { join } from 'path'

const scripts = [
  {
    name: 'Monitoring Setup',
    path: 'scripts/infrastructure/setup-monitoring.ts',
    description: 'Generate monitoring and alerting configuration',
  },
  {
    name: 'Backup Setup',
    path: 'scripts/infrastructure/setup-backups.ts',
    description: 'Generate database backup configuration',
  },
  {
    name: 'Demo Environment Setup',
    path: 'scripts/infrastructure/setup-demo-environment.ts',
    description: 'Create demo tenant with sample data',
  },
]

async function runAllSetup() {
  console.log('🚀 Running all infrastructure setup scripts...\n')

  const results: Array<{ name: string; success: boolean; error?: string }> = []

  for (const script of scripts) {
    console.log(`📦 Running: ${script.name}`)
    console.log(`   ${script.description}`)

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
  console.log('\n📊 Setup Summary:')
  console.log('='.repeat(50))
  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  results.forEach((result) => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${result.name}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Successful: ${successful}/${scripts.length}`)
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}/${scripts.length}`)
  }

  if (failed === 0) {
    console.log('\n🎉 All infrastructure setup scripts completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Review generated configuration files')
    console.log('2. Configure monitoring tools (Sentry/Bugsnag)')
    console.log('3. Set up S3 backup integration')
    console.log('4. Test demo environment')
  } else {
    console.log('\n⚠️  Some scripts failed. Please review errors above.')
    process.exit(1)
  }
}

runAllSetup().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
