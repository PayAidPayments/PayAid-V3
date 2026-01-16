/**
 * Apply Performance Indexes Migration
 * 
 * This script applies the performance indexes SQL file to the database
 * using Prisma's raw SQL execution.
 * 
 * Usage:
 *   npx tsx scripts/apply-performance-indexes.ts
 */

import { prisma } from '@/lib/db/prisma'
import * as fs from 'fs'
import * as path from 'path'

async function applyPerformanceIndexes() {
  console.log('🚀 Applying Performance Indexes...\n')

  try {
    // Read SQL file
    const sqlFilePath = path.join(process.cwd(), 'prisma', 'migrations', 'add_performance_indexes.sql')
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`❌ SQL file not found: ${sqlFilePath}`)
      process.exit(1)
    }

    const sql = fs.readFileSync(sqlFilePath, 'utf-8')
    
    // Split SQL into individual statements (remove comments and empty lines)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} index creation statements\n`)

    // Execute each statement
    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comment-only lines
      if (statement.startsWith('--') || statement.length === 0) {
        continue
      }

      try {
        // Extract index name for logging
        const indexMatch = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/i)
        const indexName = indexMatch ? indexMatch[1] : `index_${i + 1}`

        console.log(`  [${i + 1}/${statements.length}] Creating index: ${indexName}...`)

        // Execute statement
        await prisma.$executeRawUnsafe(statement + ';')

        // Check if index was created or already exists
        const result = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count 
          FROM pg_indexes 
          WHERE indexname = '${indexName}'
        `) as Array<{ count: bigint }>

        if (result[0]?.count > 0) {
          successCount++
          console.log(`    ✅ Index created: ${indexName}`)
        } else {
          skipCount++
          console.log(`    ⚠️  Index may already exist: ${indexName}`)
        }
      } catch (error: any) {
        errorCount++
        // Check if error is "already exists" (which is fine with IF NOT EXISTS)
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          skipCount++
          errorCount--
          console.log(`    ⚠️  Index already exists (skipped): ${indexName}`)
        } else {
          console.error(`    ❌ Error creating index: ${error.message}`)
          // Continue with other indexes even if one fails
        }
      }
    }

    console.log('\n📊 Summary:')
    console.log(`  ✅ Successfully created: ${successCount}`)
    console.log(`  ⚠️  Already existed (skipped): ${skipCount}`)
    if (errorCount > 0) {
      console.log(`  ❌ Errors: ${errorCount}`)
    }

    console.log('\n✅ Performance indexes migration complete!')
    console.log('\n💡 Note: Some indexes may already exist. This is normal.')
    console.log('   The "IF NOT EXISTS" clause prevents errors for existing indexes.')

  } catch (error: any) {
    console.error('\n❌ Error applying performance indexes:', error.message)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Check DATABASE_URL is set correctly')
    console.error('   2. Ensure database connection is available')
    console.error('   3. Verify you have CREATE INDEX permissions')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
applyPerformanceIndexes()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
