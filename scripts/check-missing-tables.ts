/**
 * Check for Missing Database Tables
 * 
 * This script checks which tables from the Prisma schema are missing in the database.
 * 
 * Usage:
 *   npx tsx scripts/check-missing-tables.ts
 */

import { prisma } from '../lib/db/prisma'

// List of critical models to check
const criticalModels = [
  { name: 'Tenant', model: prisma.tenant },
  { name: 'User', model: prisma.user },
  { name: 'Contact', model: prisma.contact },
  { name: 'Deal', model: prisma.deal },
  { name: 'Task', model: prisma.task },
  { name: 'Product', model: prisma.product },
  { name: 'Order', model: prisma.order },
  { name: 'Invoice', model: prisma.invoice },
  { name: 'Expense', model: prisma.expense },
  { name: 'ChartOfAccounts', model: prisma.chartOfAccounts },
  { name: 'FinancialTransaction', model: prisma.financialTransaction },
  { name: 'GeneralLedger', model: prisma.generalLedger },
  { name: 'FinancialPeriod', model: prisma.financialPeriod },
  { name: 'FinancialBudget', model: prisma.financialBudget },
  { name: 'FinancialVariance', model: prisma.financialVariance },
  { name: 'FinancialForecast', model: prisma.financialForecast },
  { name: 'Campaign', model: prisma.campaign },
  { name: 'Project', model: prisma.project },
  { name: 'ProjectTask', model: prisma.projectTask },
]

async function main() {
  console.log('🔍 Checking for missing database tables...\n')

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  const existingTables: string[] = []
  const missingTables: string[] = []
  const errorTables: Array<{ name: string; error: string }> = []

  for (const { name, model } of criticalModels) {
    try {
      await model.count({ take: 1 })
      existingTables.push(name)
      console.log(`✅ ${name}`)
    } catch (error: any) {
      if (error?.code === 'P2021') {
        // Table does not exist
        missingTables.push(name)
        console.log(`❌ ${name} - Table does not exist`)
      } else {
        // Other error (connection, permission, etc.)
        errorTables.push({ name, error: error?.message || String(error) })
        console.log(`⚠️  ${name} - Error: ${error?.message || error}`)
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Summary')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Existing tables: ${existingTables.length}`)
  console.log(`❌ Missing tables: ${missingTables.length}`)
  console.log(`⚠️  Error tables: ${errorTables.length}`)

  if (missingTables.length > 0) {
    console.log('\n❌ Missing Tables:')
    missingTables.forEach(table => console.log(`   - ${table}`))
    console.log('\n💡 To create missing tables, run:')
    console.log('   npx prisma db push')
    console.log('   or')
    console.log('   npx tsx scripts/run-migrations-vercel.ts')
  }

  if (errorTables.length > 0) {
    console.log('\n⚠️  Tables with Errors:')
    errorTables.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`)
    })
  }

  if (existingTables.length === criticalModels.length) {
    console.log('\n✅ All critical tables exist!')
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
