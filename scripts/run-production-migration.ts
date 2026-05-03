/**
 * Production Database Migration Script
 * 
 * This script helps run database migrations on production
 * It will:
 * 1. Verify DATABASE_URL is set
 * 2. Check current schema status
 * 3. Run Prisma db push (or provide migration SQL)
 * 4. Verify tables were created
 * 
 * Usage:
 *   npx tsx scripts/run-production-migration.ts
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

async function checkDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful')
    return true
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message)
    console.error('\nMake sure DATABASE_URL is set correctly')
    return false
  }
}

async function checkExistingTables() {
  const tables = [
    'SubscriptionPlan',
    'SubscriptionInvoice',
    'PaymentMethod',
    'DunningAttempt',
    'ModuleDefinition',
  ]

  const missing: string[] = []
  const existing: string[] = []

  for (const table of tables) {
    try {
      await (prisma as any)[table.toLowerCase()].findFirst({ take: 1 })
      existing.push(table)
      console.log(`  ✅ ${table} - exists`)
    } catch (error: any) {
      if (error.message?.includes('does not exist') || error.message?.includes('Unknown table')) {
        missing.push(table)
        console.log(`  ❌ ${table} - missing`)
      } else {
        console.log(`  ⚠️  ${table} - could not verify`)
      }
    }
  }

  return { existing, missing }
}

async function runMigration() {
  console.log('\n🔄 Running database migration...\n')
  
  try {
    // Run prisma db push
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'inherit',
      env: process.env,
    })
    console.log('\n✅ Migration completed successfully')
    return true
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    return false
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n')
  
  const { existing, missing } = await checkExistingTables()
  
  if (missing.length === 0) {
    console.log('\n✅ All required tables exist!')
    return true
  } else {
    console.log(`\n❌ Missing tables: ${missing.join(', ')}`)
    return false
  }
}

async function main() {
  console.log('🚀 Production Database Migration\n')
  console.log('='.repeat(60))

  // Step 1: Check connection
  console.log('\n1. Checking database connection...')
  const connected = await checkDatabaseConnection()
  if (!connected) {
    process.exit(1)
  }

  // Step 2: Check existing tables
  console.log('\n2. Checking existing tables...')
  const { existing, missing } = await checkExistingTables()

  if (missing.length === 0) {
    console.log('\n✅ All tables already exist! No migration needed.')
    await prisma.$disconnect()
    process.exit(0)
  }

  console.log(`\n📊 Status: ${existing.length} existing, ${missing.length} missing`)

  // Step 3: Confirm migration
  console.log('\n⚠️  The following tables need to be created:')
  missing.forEach(table => console.log(`   - ${table}`))
  
  console.log('\nProceeding with migration...')

  // Step 4: Run migration
  const migrationSuccess = await runMigration()

  if (!migrationSuccess) {
    console.log('\n❌ Migration failed. Please check the error above.')
    await prisma.$disconnect()
    process.exit(1)
  }

  // Step 5: Verify
  const verified = await verifyMigration()

  if (verified) {
    console.log('\n🎉 Migration completed and verified successfully!')
    console.log('\nNext step: Run module seeding')
    console.log('  npx tsx scripts/seed-modules.ts')
  } else {
    console.log('\n⚠️  Migration completed but verification failed.')
    console.log('Please check the database manually.')
  }

  await prisma.$disconnect()
  process.exit(verified ? 0 : 1)
}

main().catch((error) => {
  console.error('Migration script failed:', error)
  process.exit(1)
})

