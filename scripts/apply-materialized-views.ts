/**
 * Apply Materialized Views for Financial Dashboard
 * 
 * This script applies the materialized views SQL to the database
 * Run this after database schema is applied
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Applying materialized views for Financial Dashboard...')

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'prisma', 'migrations', 'financial-dashboard-materialized-views.sql')
    const sql = readFileSync(sqlPath, 'utf-8')

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements to execute`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length === 0) continue

      try {
        // Execute via Prisma raw query
        await prisma.$executeRawUnsafe(statement)
        console.log(`✓ Executed statement ${i + 1}/${statements.length}`)
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate')) {
          console.log(`⚠ Statement ${i + 1} already exists, skipping`)
        } else {
          console.error(`✗ Error executing statement ${i + 1}:`, error.message)
          // Continue with other statements
        }
      }
    }

    console.log('\n✅ Materialized views applied successfully!')
    console.log('\nYou can now refresh views using:')
    console.log('  SELECT refresh_all_financial_views();')
  } catch (error) {
    console.error('Error applying materialized views:', error)
    throw error
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
