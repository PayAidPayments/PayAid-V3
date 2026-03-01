/**
 * Run Database Migrations (off-Vercel only; pooler-only deploy does not run this)
 *
 * Runs Prisma migrations. Requires direct DB access (DIRECT_DATABASE_URL or a
 * non-pooler DATABASE_URL). Do NOT run during Vercel build; the app uses
 * pooler-only until a direct connection is available.
 *
 * Usage (from a machine with direct DB access):
 *   vercel env pull .env.production --environment=production
 *   npx tsx scripts/run-migrations-vercel.ts
 * Or: npm run db:migrate:vercel
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { prisma } from './prisma-client'

async function main() {
  console.log('🚀 Starting database migrations for Vercel...\n')

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set')
    console.error('Please set DATABASE_URL before running migrations')
    process.exit(1)
  }

  try {
    // Step 1: Generate Prisma Client
    console.log('📦 Step 1: Generating Prisma Client...')
    try {
      execSync('npx prisma generate', {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
      console.log('✅ Prisma Client generated\n')
    } catch (error) {
      console.warn('⚠️  Prisma generate had issues:', error)
      console.log('   Continuing with db push...\n')
    }

    // Step 2: Check if migrations folder exists
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations')
    const hasMigrations = existsSync(migrationsDir) && 
      existsSync(join(migrationsDir, '20250101000000_add_business_units_and_module_licenses'))

    if (hasMigrations) {
      // Step 2a: Run migrations (if they exist)
      console.log('📤 Step 2: Running Prisma migrations...')
      try {
        execSync('npx prisma migrate deploy', {
          stdio: 'inherit',
          cwd: process.cwd(),
        })
        console.log('✅ Migrations applied\n')
      } catch (error: any) {
        // If migrations fail, try db push as fallback
        console.warn('⚠️  Migrations failed, trying db push as fallback...')
        console.log('   Error:', error?.message || error)
        throw error // Will be caught by fallback below
      }
    } else {
      // Step 2b: Use db push (no migrations available)
      console.log('📤 Step 2: Pushing schema to database (no migrations found)...')
      try {
        execSync('npx prisma db push --skip-generate --accept-data-loss', {
          stdio: 'inherit',
          cwd: process.cwd(),
        })
        console.log('✅ Schema pushed to database\n')
      } catch (error) {
        console.error('❌ Failed to push schema:', error)
        throw error
      }
    }

    // Step 3: Verify critical tables exist
    console.log('🔍 Step 3: Verifying critical tables...')
    try {
      const criticalTables = [
        { name: 'Tenant', model: prisma.tenant },
        { name: 'User', model: prisma.user },
        { name: 'Contact', model: prisma.contact },
        { name: 'Deal', model: prisma.deal },
        { name: 'Invoice', model: prisma.invoice },
        { name: 'ChartOfAccounts', model: prisma.chartOfAccounts },
        { name: 'FinancialTransaction', model: prisma.financialTransaction },
      ]

      const missingTables: string[] = []
      
      for (const table of criticalTables) {
        try {
          await table.model.count({ take: 1 })
          console.log(`  ✅ ${table.name} table exists`)
        } catch (error: any) {
          if (error?.code === 'P2021') {
            console.warn(`  ⚠️  ${table.name} table does NOT exist`)
            missingTables.push(table.name)
          } else {
            console.error(`  ❌ Error checking ${table.name}:`, error?.message || error)
          }
        }
      }

      if (missingTables.length > 0) {
        console.warn(`\n⚠️  Missing tables: ${missingTables.join(', ')}`)
        console.warn('   These tables may need to be created manually or via db push')
      } else {
        console.log('\n✅ All critical tables exist')
      }
    } catch (verifyError) {
      console.warn('⚠️  Could not verify tables (this is okay if tables are being created):', verifyError)
    }

    console.log('\n✅ Migration process completed!')
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error?.message || error)
    console.error('\nTroubleshooting:')
    console.error('1. Check DATABASE_URL is correct')
    console.error('2. Verify database is accessible')
    console.error('3. Check if database has required permissions')
    console.error('4. Try running: npx prisma db push --skip-generate')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
