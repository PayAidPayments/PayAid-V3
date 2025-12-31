/**
 * Post-Deployment Setup Script
 * 
 * This script helps complete post-deployment tasks:
 * 1. Verify database connection
 * 2. Check if migrations are needed
 * 3. Seed module definitions
 * 4. Verify environment variables
 * 
 * Usage:
 *   npx tsx scripts/post-deployment-setup.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SetupResult {
  step: string
  status: 'success' | 'error' | 'warning'
  message: string
}

const results: SetupResult[] = []

function logResult(step: string, status: 'success' | 'error' | 'warning', message: string) {
  results.push({ step, status, message })
  const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️'
  console.log(`${icon} ${step}: ${message}`)
}

async function verifyDatabaseConnection() {
  try {
    await prisma.$connect()
    logResult('Database Connection', 'success', 'Connected to database successfully')
    return true
  } catch (error: any) {
    logResult('Database Connection', 'error', `Failed to connect: ${error.message}`)
    return false
  }
}

async function checkSchemaTables() {
  try {
    // Check if new tables exist
    const tables = [
      'SubscriptionPlan',
      'SubscriptionInvoice',
      'PaymentMethod',
      'DunningAttempt',
      'ModuleDefinition',
    ]

    const missingTables: string[] = []

    for (const table of tables) {
      try {
        // Try to query the table
        await (prisma as any)[table.toLowerCase()].findFirst({ take: 1 })
        logResult(`Table: ${table}`, 'success', 'Exists')
      } catch (error: any) {
        if (error.message?.includes('does not exist') || error.message?.includes('Unknown table')) {
          missingTables.push(table)
          logResult(`Table: ${table}`, 'error', 'Missing - migration needed')
        } else {
          logResult(`Table: ${table}`, 'warning', 'Could not verify')
        }
      }
    }

    if (missingTables.length > 0) {
      logResult('Schema Status', 'error', `Missing tables: ${missingTables.join(', ')}. Run: npx prisma db push`)
      return false
    }

    logResult('Schema Status', 'success', 'All required tables exist')
    return true
  } catch (error: any) {
    logResult('Schema Check', 'error', `Error: ${error.message}`)
    return false
  }
}

async function checkModuleDefinitions() {
  try {
    const modules = await prisma.moduleDefinition.findMany()
    const expectedModules = [
      'crm', 'sales', 'marketing', 'finance', 'hr',
      'communication', 'ai-studio', 'analytics',
      'invoicing', 'accounting', 'whatsapp'
    ]

    const existingModuleIds = modules.map(m => m.moduleId)
    const missingModules = expectedModules.filter(id => !existingModuleIds.includes(id))

    if (missingModules.length > 0) {
      logResult('Module Definitions', 'warning', `Missing modules: ${missingModules.join(', ')}. Run: npx tsx scripts/seed-modules.ts`)
      return false
    }

    logResult('Module Definitions', 'success', `All ${expectedModules.length} modules exist`)
    return true
  } catch (error: any) {
    logResult('Module Definitions', 'error', `Error: ${error.message}`)
    return false
  }
}

async function checkEnvironmentVariables() {
  const requiredVars = [
    'DATABASE_URL',
    'CRON_SECRET',
    'ENCRYPTION_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ]

  const optionalVars = [
    'SENTRY_DSN',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ]

  const missing: string[] = []
  const present: string[] = []

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      present.push(varName)
    } else {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    logResult('Environment Variables', 'error', `Missing required: ${missing.join(', ')}`)
    return false
  }

  logResult('Environment Variables', 'success', `All required variables present (${present.length}/${requiredVars.length})`)
  
  // Check optional
  const missingOptional = optionalVars.filter(v => !process.env[v])
  if (missingOptional.length > 0) {
    logResult('Optional Variables', 'warning', `Missing optional: ${missingOptional.join(', ')}`)
  }

  return true
}

async function seedModulesIfNeeded() {
  try {
    const modules = await prisma.moduleDefinition.findMany()
    const expectedCount = 11

    if (modules.length < expectedCount) {
      logResult('Module Seeding', 'warning', `Only ${modules.length}/${expectedCount} modules found. Seeding...`)
      
      // Import and run seed
      const { execSync } = require('child_process')
      try {
        execSync('npx tsx scripts/seed-modules.ts', { stdio: 'inherit' })
        logResult('Module Seeding', 'success', 'Modules seeded successfully')
        return true
      } catch (error: any) {
        logResult('Module Seeding', 'error', `Failed to seed: ${error.message}`)
        return false
      }
    }

    logResult('Module Seeding', 'success', `All modules present (${modules.length})`)
    return true
  } catch (error: any) {
    logResult('Module Seeding', 'error', `Error: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Starting Post-Deployment Setup\n')
  console.log('='.repeat(60))

  // Step 1: Verify database connection
  const dbConnected = await verifyDatabaseConnection()
  if (!dbConnected) {
    console.log('\n❌ Cannot proceed without database connection')
    process.exit(1)
  }

  // Step 2: Check schema
  await checkSchemaTables()

  // Step 3: Check environment variables
  await checkEnvironmentVariables()

  // Step 4: Check and seed modules
  await checkModuleDefinitions()
  await seedModulesIfNeeded()

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Setup Summary\n')

  const success = results.filter(r => r.status === 'success').length
  const errors = results.filter(r => r.status === 'error').length
  const warnings = results.filter(r => r.status === 'warning').length

  console.log(`✅ Success: ${success}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log(`❌ Errors: ${errors}`)

  if (errors > 0) {
    console.log('\n❌ Setup incomplete. Please fix errors above.')
    console.log('\nCommon fixes:')
    console.log('  1. Run database migration: npx prisma db push')
    console.log('  2. Seed modules: npx tsx scripts/seed-modules.ts')
    console.log('  3. Set environment variables in Vercel dashboard')
    process.exit(1)
  } else if (warnings > 0) {
    console.log('\n⚠️  Setup complete with warnings. Review above.')
    process.exit(0)
  } else {
    console.log('\n🎉 All setup steps completed successfully!')
    process.exit(0)
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

