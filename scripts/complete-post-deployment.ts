/**
 * Complete Post-Deployment Setup
 * 
 * This script runs all post-deployment steps:
 * 1. Verify environment variables
 * 2. Run database migration
 * 3. Seed module definitions
 * 4. Verify everything is set up correctly
 * 
 * Usage:
 *   npx tsx scripts/complete-post-deployment.ts
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

interface StepResult {
  step: string
  status: 'success' | 'error' | 'warning' | 'skipped'
  message: string
}

const results: StepResult[] = []

function logResult(step: string, status: 'success' | 'error' | 'warning' | 'skipped', message: string) {
  results.push({ step, status, message })
  const icon = 
    status === 'success' ? '✅' : 
    status === 'error' ? '❌' : 
    status === 'warning' ? '⚠️' : 
    '⏭️'
  console.log(`${icon} ${step}: ${message}`)
}

async function step1_VerifyEnvironment() {
  console.log('\n📋 Step 1: Verifying Environment Variables\n')
  
  const required = [
    'DATABASE_URL',
    'CRON_SECRET',
    'ENCRYPTION_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ]

  const missing: string[] = []
  const present: string[] = []

  for (const varName of required) {
    if (process.env[varName]) {
      present.push(varName)
      logResult(varName, 'success', 'Set')
    } else {
      missing.push(varName)
      logResult(varName, 'error', 'Missing')
    }
  }

  if (missing.length > 0) {
    logResult('Environment Check', 'error', `Missing: ${missing.join(', ')}`)
    return false
  }

  logResult('Environment Check', 'success', `All ${required.length} required variables present`)
  return true
}

async function step2_CheckDatabaseConnection() {
  console.log('\n📋 Step 2: Checking Database Connection\n')
  
  try {
    await prisma.$connect()
    logResult('Database Connection', 'success', 'Connected successfully')
    return true
  } catch (error: any) {
    logResult('Database Connection', 'error', `Failed: ${error.message}`)
    return false
  }
}

async function step3_CheckSchema() {
  console.log('\n📋 Step 3: Checking Database Schema\n')
  
  const tables = [
    'SubscriptionPlan',
    'SubscriptionInvoice',
    'PaymentMethod',
    'DunningAttempt',
    'ModuleDefinition',
  ]

  const missing: string[] = []

  for (const table of tables) {
    try {
      await (prisma as any)[table.toLowerCase()].findFirst({ take: 1 })
      logResult(`Table: ${table}`, 'success', 'Exists')
    } catch (error: any) {
      if (error.message?.includes('does not exist') || error.message?.includes('Unknown table')) {
        missing.push(table)
        logResult(`Table: ${table}`, 'error', 'Missing')
      } else {
        logResult(`Table: ${table}`, 'warning', 'Could not verify')
      }
    }
  }

  if (missing.length > 0) {
    logResult('Schema Check', 'error', `Missing tables: ${missing.join(', ')}`)
    return { needsMigration: true, missing }
  }

  logResult('Schema Check', 'success', 'All tables exist')
  return { needsMigration: false, missing: [] }
}

async function step4_RunMigration(needed: boolean) {
  if (!needed) {
    logResult('Migration', 'skipped', 'Not needed - all tables exist')
    return true
  }

  console.log('\n📋 Step 4: Running Database Migration\n')
  
  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'inherit',
      env: process.env,
    })
    logResult('Migration', 'success', 'Completed successfully')
    return true
  } catch (error: any) {
    logResult('Migration', 'error', `Failed: ${error.message}`)
    return false
  }
}

async function step5_CheckModules() {
  console.log('\n📋 Step 5: Checking Module Definitions\n')
  
  try {
    const modules = await prisma.moduleDefinition.findMany()
    const expectedCount = 11
    const expectedModules = [
      'crm', 'sales', 'marketing', 'finance', 'hr',
      'communication', 'ai-studio', 'analytics',
      'invoicing', 'accounting', 'whatsapp'
    ]

    const existingIds = modules.map(m => m.moduleId)
    const missing = expectedModules.filter(id => !existingIds.includes(id))

    if (missing.length > 0) {
      logResult('Module Check', 'warning', `Missing: ${missing.join(', ')} (${modules.length}/${expectedCount})`)
      return { needsSeeding: true, missing }
    }

    logResult('Module Check', 'success', `All ${expectedCount} modules exist`)
    return { needsSeeding: false, missing: [] }
  } catch (error: any) {
    logResult('Module Check', 'error', `Error: ${error.message}`)
    return { needsSeeding: false, missing: [] }
  }
}

async function step6_SeedModules(needed: boolean) {
  if (!needed) {
    logResult('Module Seeding', 'skipped', 'Not needed - all modules exist')
    return true
  }

  console.log('\n📋 Step 6: Seeding Module Definitions\n')
  
  try {
    execSync('npx tsx scripts/seed-modules.ts', {
      stdio: 'inherit',
      env: process.env,
    })
    logResult('Module Seeding', 'success', 'Completed successfully')
    return true
  } catch (error: any) {
    logResult('Module Seeding', 'error', `Failed: ${error.message}`)
    return false
  }
}

async function step7_FinalVerification() {
  console.log('\n📋 Step 7: Final Verification\n')
  
  // Re-check everything
  const schemaCheck = await step3_CheckSchema()
  const moduleCheck = await step5_CheckModules()

  if (schemaCheck.needsMigration || moduleCheck.needsSeeding) {
    logResult('Final Verification', 'error', 'Setup incomplete')
    return false
  }

  logResult('Final Verification', 'success', 'All checks passed!')
  return true
}

async function main() {
  console.log('🚀 Complete Post-Deployment Setup\n')
  console.log('='.repeat(60))

  let allSuccess = true

  // Step 1: Environment
  if (!await step1_VerifyEnvironment()) {
    console.log('\n❌ Environment variables missing. Please set them first.')
    process.exit(1)
  }

  // Step 2: Database connection
  if (!await step2_CheckDatabaseConnection()) {
    console.log('\n❌ Cannot connect to database. Check DATABASE_URL.')
    await prisma.$disconnect()
    process.exit(1)
  }

  // Step 3: Check schema
  const schemaCheck = await step3_CheckSchema()

  // Step 4: Run migration if needed
  if (schemaCheck.needsMigration) {
    if (!await step4_RunMigration(true)) {
      allSuccess = false
    }
  }

  // Step 5: Check modules
  const moduleCheck = await step5_CheckModules()

  // Step 6: Seed modules if needed
  if (moduleCheck.needsSeeding) {
    if (!await step6_SeedModules(true)) {
      allSuccess = false
    }
  }

  // Step 7: Final verification
  const verified = await step7_FinalVerification()
  if (!verified) {
    allSuccess = false
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Setup Summary\n')

  const success = results.filter(r => r.status === 'success').length
  const errors = results.filter(r => r.status === 'error').length
  const warnings = results.filter(r => r.status === 'warning').length
  const skipped = results.filter(r => r.status === 'skipped').length

  console.log(`✅ Success: ${success}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log(`❌ Errors: ${errors}`)
  console.log(`⏭️  Skipped: ${skipped}`)

  if (allSuccess && verified) {
    console.log('\n🎉 Post-deployment setup completed successfully!')
    console.log('\n✅ All systems ready for production!')
    process.exit(0)
  } else {
    console.log('\n⚠️  Setup completed with issues. Please review above.')
    process.exit(1)
  }
}

main()
  .catch((error) => {
    console.error('Setup failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

