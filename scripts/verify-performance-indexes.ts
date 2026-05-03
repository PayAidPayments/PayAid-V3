/**
 * Verify Performance Indexes
 * 
 * This script verifies that all performance indexes were created successfully
 */

import { prisma } from '@/lib/db/prisma'

async function verifyIndexes() {
  console.log('🔍 Verifying Performance Indexes...\n')

  try {
    // Query to get all performance indexes
    const indexes = await prisma.$queryRawUnsafe(`
      SELECT 
        indexname,
        tablename,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `) as Array<{
      indexname: string
      tablename: string
      indexdef: string
    }>

    console.log(`📊 Found ${indexes.length} performance indexes:\n`)

    // Group by table
    const byTable: Record<string, Array<{ indexname: string; indexdef: string }>> = {}
    indexes.forEach(idx => {
      if (!byTable[idx.tablename]) {
        byTable[idx.tablename] = []
      }
      byTable[idx.tablename].push({
        indexname: idx.indexname,
        indexdef: idx.indexdef,
      })
    })

    // Display by table
    for (const [table, tableIndexes] of Object.entries(byTable)) {
      console.log(`📋 ${table}:`)
      tableIndexes.forEach(idx => {
        console.log(`   ✅ ${idx.indexname}`)
      })
      console.log('')
    }

    // Expected indexes
    const expectedIndexes = [
      'idx_contact_tenant_status_created',
      'idx_contact_list_covering',
      'idx_deal_tenant_stage_value',
      'idx_task_tenant_status_due',
      'idx_order_tenant_status_created',
      'idx_invoice_tenant_status_due',
      'idx_invoice_list_covering',
      'idx_user_tenant_fk',
      'idx_contact_search',
      'idx_deal_contact_fk',
      'idx_task_contact_fk',
    ]

    const foundIndexNames = indexes.map(idx => idx.indexname)
    const missingIndexes = expectedIndexes.filter(name => !foundIndexNames.includes(name))

    console.log('📊 Summary:')
    console.log(`   ✅ Found: ${indexes.length} indexes`)
    console.log(`   ✅ Expected: ${expectedIndexes.length} indexes`)

    if (missingIndexes.length > 0) {
      console.log(`   ⚠️  Missing: ${missingIndexes.length} indexes`)
      missingIndexes.forEach(name => {
        console.log(`      - ${name}`)
      })
    } else {
      console.log('   ✅ All expected indexes found!')
    }

    console.log('\n✅ Verification complete!')

  } catch (error: any) {
    console.error('❌ Error verifying indexes:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyIndexes()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
