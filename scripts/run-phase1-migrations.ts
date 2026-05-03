/**
 * Phase 1: Run Database Migrations
 * 
 * This script runs Phase 1 migrations:
 * 1. Prisma generate
 * 2. Prisma db push
 * 3. SQL RLS policies (if DATABASE_URL is set)
 * 
 * Usage:
 *   npx tsx scripts/run-phase1-migrations.ts
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'
import { prisma } from '../lib/db/prisma'

async function main() {
  console.log('🚀 Starting Phase 1 migrations...\n')

  try {
    // Step 1: Prisma Generate
    console.log('📦 Step 1: Generating Prisma Client...')
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: process.cwd(),
      })
      console.log('✅ Prisma Client generated\n')
    } catch (error) {
      console.warn('⚠️  Prisma generate had issues (may be file lock on Windows):', error)
      console.log('   Continuing with db push...\n')
    }

    // Step 2: Prisma DB Push
    console.log('📤 Step 2: Pushing schema to database...')
    try {
      execSync('npx prisma db push --skip-generate', {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
      console.log('✅ Schema pushed to database\n')
    } catch (error) {
      console.error('❌ Failed to push schema:', error)
      throw error
    }

    // Step 3: Apply RLS Policies (if DATABASE_URL is set)
    if (process.env.DATABASE_URL) {
      console.log('🔒 Step 3: Applying RLS policies...')
      
      const sqlFile = join(process.cwd(), 'prisma', 'migrations', 'phase1-rls-policies.sql')
      
      try {
        const sql = readFileSync(sqlFile, 'utf-8')
        
        // Execute SQL using Prisma
        // Note: For production, use psql directly: psql $DATABASE_URL -f prisma/migrations/phase1-rls-policies.sql
        console.log('   Executing RLS policies SQL...')
        
        // Split SQL into individual statements
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'))

        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await prisma.$executeRawUnsafe(statement)
            } catch (error: any) {
              // Ignore "already exists" errors
              if (!error.message?.includes('already exists') && 
                  !error.message?.includes('duplicate')) {
                console.warn(`   Warning: ${error.message}`)
              }
            }
          }
        }

        console.log('✅ RLS policies applied\n')
      } catch (error) {
        console.warn('⚠️  Could not apply RLS policies via Prisma')
        console.log('   Please run manually: psql $DATABASE_URL -f prisma/migrations/phase1-rls-policies.sql\n')
      }
    } else {
      console.log('⚠️  Step 3: DATABASE_URL not set, skipping RLS policies')
      console.log('   To apply RLS policies manually, run:')
      console.log('   psql $DATABASE_URL -f prisma/migrations/phase1-rls-policies.sql\n')
    }

    console.log('✅ Phase 1 migrations complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. Initialize default roles: npx tsx scripts/initialize-default-roles.ts')
    console.log('   2. Verify environment variables are set (JWT_SECRET, etc.)')
    console.log('   3. Test login flow with new RBAC system\n')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
