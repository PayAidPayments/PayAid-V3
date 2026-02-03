/**
 * Verify Database Schema and Fix Materialized Views SQL
 * 
 * This script checks the actual database column names and updates the SQL accordingly
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying database schema and fixing materialized views SQL...\n')

  try {
    // Check if tables exist and get their column names
    const tables = ['chart_of_accounts', 'financial_transactions', 'financial_periods', 'general_ledger']
    
    for (const tableName of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position
        `)
        
        console.log(`\n📊 Table: ${tableName}`)
        console.log('Columns:', result)
      } catch (error: any) {
        console.log(`⚠️  Could not check table ${tableName}:`, error.message)
      }
    }

    // Try to create a simple materialized view to test
    console.log('\n🧪 Testing materialized view creation...')
    
    // Test with actual Prisma field names converted to snake_case
    const testSQL = `
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_test_account_balances AS
      SELECT
        "tenantId" as tenant_id,
        id as account_id,
        "accountCode" as account_code,
        "accountName" as account_name
      FROM chart_of_accounts
      LIMIT 1;
    `
    
    try {
      await prisma.$executeRawUnsafe(testSQL)
      console.log('✅ Test view created successfully')
      await prisma.$executeRawUnsafe('DROP MATERIALIZED VIEW IF EXISTS mv_test_account_balances')
    } catch (error: any) {
      console.log('❌ Test failed:', error.message)
      console.log('\n💡 Trying with snake_case column names...')
      
      const testSQL2 = `
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_test_account_balances AS
        SELECT
          tenant_id,
          id as account_id,
          account_code,
          account_name
        FROM chart_of_accounts
        LIMIT 1;
      `
      
      try {
        await prisma.$executeRawUnsafe(testSQL2)
        console.log('✅ Test view created successfully with snake_case')
        await prisma.$executeRawUnsafe('DROP MATERIALIZED VIEW IF EXISTS mv_test_account_balances')
        console.log('\n✅ Database uses snake_case column names')
      } catch (error2: any) {
        console.log('❌ Test failed:', error2.message)
      }
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
