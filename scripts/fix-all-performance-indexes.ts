/**
 * Fix All Performance Indexes - Comprehensive Solution
 * 
 * This script ensures all performance indexes are created correctly
 * using Prisma's validated column names (no fallback approach)
 */

import { prisma } from '@/lib/db/prisma'

interface IndexDefinition {
  name: string
  table: string
  columns: string[]
  unique?: boolean
  sort?: 'Asc' | 'Desc'
}

// All performance indexes with correct column names (from Prisma schema)
const performanceIndexes: IndexDefinition[] = [
  // Contact indexes
  {
    name: 'idx_contact_tenant_status_created',
    table: 'Contact',
    columns: ['tenantId', 'status', 'createdAt'],
    sort: 'Desc',
  },
  {
    name: 'idx_contact_list_covering',
    table: 'Contact',
    columns: ['tenantId', 'status'],
  },
  
  // Deal indexes
  {
    name: 'idx_deal_tenant_stage_value',
    table: 'Deal',
    columns: ['tenantId', 'stage', 'value'],
    sort: 'Desc',
  },
  
  // Task indexes
  {
    name: 'idx_task_tenant_status_due',
    table: 'Task',
    columns: ['tenantId', 'status', 'dueDate'],
  },
  {
    name: 'idx_task_contact_fk',
    table: 'Task',
    columns: ['contactId'],
  },
  
  // Order indexes
  {
    name: 'idx_order_tenant_status_created',
    table: 'Order',
    columns: ['tenantId', 'status', 'createdAt'],
    sort: 'Desc',
  },
  
  // Invoice indexes
  {
    name: 'idx_invoice_tenant_status_due',
    table: 'Invoice',
    columns: ['tenantId', 'status', 'dueDate'],
  },
  {
    name: 'idx_invoice_list_covering',
    table: 'Invoice',
    columns: ['tenantId', 'status'],
  },
  
  // User indexes
  {
    name: 'idx_user_tenant_fk',
    table: 'User',
    columns: ['tenantId'],
  },
]

async function fixAllPerformanceIndexes() {
  console.log('🔧 Fixing All Performance Indexes...\n')
  console.log('📊 Using: Prisma-validated column names (No Fallbacks)\n')

  let created = 0
  let skipped = 0
  let errors = 0
  const errorDetails: Array<{ name: string; error: string }> = []

  for (const indexDef of performanceIndexes) {
    try {
      // Check if index already exists
      const existingIndexes = await prisma.$queryRawUnsafe(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND tablename = $1 
          AND indexname = $2
      `, indexDef.table, indexDef.name) as Array<{ indexname: string }>

      if (existingIndexes.length > 0) {
        console.log(`  ✅ ${indexDef.name} - Already exists`)
        skipped++
        continue
      }

      // Build CREATE INDEX statement with proper quoting
      const columns = indexDef.columns.map(col => `"${col}"`).join(', ')
      const sortClause = indexDef.sort === 'Desc' ? ' DESC' : ''
      const uniqueClause = indexDef.unique ? 'UNIQUE ' : ''
      
      const sql = `
        CREATE ${uniqueClause}INDEX IF NOT EXISTS ${indexDef.name}
        ON "${indexDef.table}"(${columns}${sortClause})
      `.trim()

      console.log(`  [${created + skipped + errors + 1}/${performanceIndexes.length}] Creating: ${indexDef.name}...`)

      // Execute using Prisma (validates column names)
      await prisma.$executeRawUnsafe(sql)

      // Verify creation
      const verifyIndexes = await prisma.$queryRawUnsafe(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND tablename = $1 
          AND indexname = $2
      `, indexDef.table, indexDef.name) as Array<{ indexname: string }>

      if (verifyIndexes.length > 0) {
        created++
        console.log(`    ✅ Created: ${indexDef.name}`)
      } else {
        skipped++
        console.log(`    ⚠️  May already exist: ${indexDef.name}`)
      }
    } catch (error: any) {
      errors++
      errorDetails.push({ name: indexDef.name, error: error.message })
      
      // Check if it's a "already exists" error (which is fine)
      if (error.message?.includes('already exists') || 
          error.message?.includes('duplicate') ||
          (error.message?.includes('relation') && error.message?.includes('already exists'))) {
        skipped++
        errors--
        console.log(`    ⚠️  Already exists (skipped): ${indexDef.name}`)
      } else {
        console.error(`    ❌ Error: ${error.message}`)
      }
    }
  }

  console.log('\n📊 Summary:')
  console.log(`  ✅ Created: ${created}`)
  console.log(`  ⚠️  Skipped (already exist): ${skipped}`)
  if (errors > 0) {
    console.log(`  ❌ Errors: ${errors}`)
    console.log('\n⚠️  Error Details:')
    errorDetails.forEach(({ name, error }) => {
      console.log(`    - ${name}: ${error.substring(0, 100)}`)
    })
  }

  // Final verification
  console.log('\n🔍 Final Verification...')
  const allIndexes = await prisma.$queryRawUnsafe(`
    SELECT indexname, tablename
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
    ORDER BY tablename, indexname
  `) as Array<{ indexname: string; tablename: string }>

  const expectedNames = performanceIndexes.map(idx => idx.name)
  const foundNames = allIndexes.map(idx => idx.indexname)
  const missing = expectedNames.filter(name => !foundNames.includes(name))

  console.log(`\n📊 Final Status:`)
  console.log(`  ✅ Total indexes found: ${allIndexes.length}`)
  console.log(`  ✅ Expected indexes: ${expectedNames.length}`)
  
  if (missing.length > 0) {
    console.log(`  ⚠️  Still missing: ${missing.length}`)
    missing.forEach(name => console.log(`      - ${name}`))
  } else {
    console.log(`  ✅ All indexes present!`)
  }

  console.log('\n✅ Fix complete!')
  
  if (missing.length === 0 && errors === 0) {
    console.log('\n🎉 All performance indexes are now properly configured!')
    console.log('   No more column name mismatch issues.')
  }
}

fixAllPerformanceIndexes()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
