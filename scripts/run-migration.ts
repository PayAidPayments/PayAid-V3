/**
 * Run Database Migration Script
 * 
 * This script helps run the database migration safely
 * 
 * Usage:
 *   npx tsx scripts/run-migration.ts
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

console.log('🚀 Starting Database Migration...\n')

try {
  // Step 1: Generate Prisma Client
  console.log('📦 Step 1: Generating Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma Client generated\n')

  // Step 2: Check migration status
  console.log('📊 Step 2: Checking migration status...')
  try {
    const status = execSync('npx prisma migrate status', { encoding: 'utf-8' })
    console.log(status)
  } catch (error: any) {
    console.log('⚠️  Migration status check failed (this is normal if no migrations exist yet)')
  }

  // Step 3: Create and apply migration
  console.log('\n📝 Step 3: Creating migration...')
  console.log('⚠️  Note: This will prompt you to apply the migration')
  console.log('   Run this command manually:')
  console.log('   npx prisma migrate dev --name add_all_advanced_features\n')

  // Alternative: Use db push for quick setup
  console.log('💡 Alternative: Use db push for quick setup (development only):')
  console.log('   npx prisma db push\n')

  console.log('✅ Migration script ready')
  console.log('\n📋 Next Steps:')
  console.log('1. Run: npx prisma migrate dev --name add_all_advanced_features')
  console.log('2. Or: npx prisma db push (for quick development setup)')
  console.log('3. Verify: npx tsx scripts/complete-next-steps.ts')

} catch (error: any) {
  console.error('❌ Error:', error.message)
  console.log('\n💡 Manual Steps:')
  console.log('1. npx prisma generate')
  console.log('2. npx prisma migrate dev --name add_all_advanced_features')
  console.log('3. Or: npx prisma db push')
  process.exit(1)
}

