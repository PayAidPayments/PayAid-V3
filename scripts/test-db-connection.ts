/**
 * Test Database Connection Script
 * Tests if database connection works
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Testing database connection...\n')

  try {
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful!')

    // Test query
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('✅ Database query successful!')
    console.log('   Database:', result)

    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `

    if (tables.length === 0) {
      console.log('\n⚠️  No tables found in database')
      console.log('💡 Run migrations: npm run db:migrate')
    } else {
      console.log(`\n✅ Found ${tables.length} tables:`)
      tables.slice(0, 10).forEach(table => {
        console.log(`   - ${table.tablename}`)
      })
      if (tables.length > 10) {
        console.log(`   ... and ${tables.length - 10} more`)
      }
    }

  } catch (error: any) {
    console.error('❌ Database connection failed!')
    console.error('\nError:', error.message)

    if (error.code === 'P1001') {
      console.log('\n💡 Connection timeout or refused')
      console.log('   Possible causes:')
      console.log('   1. Database server is down')
      console.log('   2. Wrong connection string')
      console.log('   3. Firewall blocking connection')
      console.log('   4. Supabase project paused (free tier)')
    } else if (error.code === 'P1002') {
      console.log('\n💡 Connection timeout')
      console.log('   Try:')
      console.log('   1. Use direct connection (not pooler)')
      console.log('   2. Use local PostgreSQL')
      console.log('   3. Check Supabase project status')
    } else if (error.code === 'P1000') {
      console.log('\n💡 Authentication failed')
      console.log('   Check DATABASE_URL in .env file')
    }

    console.log('\n💡 Solutions:')
    console.log('   1. Check .env file DATABASE_URL')
    console.log('   2. Verify database is running')
    console.log('   3. Try direct connection (not pooler)')
    console.log('   4. Use local PostgreSQL for development')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

