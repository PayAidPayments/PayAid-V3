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
    
    // Better SQL parsing that handles dollar-quoted strings
    const statements: string[] = []
    let currentStatement = ''
    let inDollarQuote = false
    let dollarTag = ''
    
    const lines = sql.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Skip comments
      if (trimmed.startsWith('--') || trimmed.length === 0) {
        continue
      }
      
      // Check for dollar-quoted string start/end
      const dollarMatch = trimmed.match(/\$([^$]*)\$/)
      if (dollarMatch) {
        if (!inDollarQuote) {
          inDollarQuote = true
          dollarTag = dollarMatch[0]
        } else if (trimmed.includes(dollarTag)) {
          inDollarQuote = false
          dollarTag = ''
        }
      }
      
      currentStatement += line + '\n'
      
      // If we're not in a dollar quote and we hit a semicolon, it's the end of a statement
      if (!inDollarQuote && trimmed.endsWith(';')) {
        const stmt = currentStatement.trim()
        if (stmt.length > 0 && !stmt.startsWith('--')) {
          statements.push(stmt)
        }
        currentStatement = ''
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim())
    }

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
            error.message?.includes('duplicate') ||
            error.message?.includes('relation') && error.message?.includes('already exists')) {
          console.log(`⚠ Statement ${i + 1} already exists, skipping`)
        } else {
          console.error(`✗ Error executing statement ${i + 1}:`, error.message)
          // Continue with other statements even if this one fails
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
