/**
 * Quick database connection test
 * Run: npx tsx scripts/test-db-connection.ts
 */

import { prisma } from '@/lib/db/prisma'

async function testConnection() {
  console.log('🔍 Testing database connection...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set')
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Please set it in .env.local')
    process.exit(1)
  }

  try {
    console.log('⏳ Attempting to connect...')
    const startTime = Date.now()
    
    // Test basic query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    const duration = Date.now() - startTime
    
    console.log('✅ Database connection successful!')
    console.log(`⏱️  Query took ${duration}ms`)
    console.log('Result:', result)
    
    // Test user query (what login does)
    console.log('\n🔍 Testing user query (simulating login)...')
    const userStartTime = Date.now()
    const userCount = await prisma.user.count()
    const userDuration = Date.now() - userStartTime
    
    console.log(`✅ User query successful!`)
    console.log(`⏱️  Query took ${userDuration}ms`)
    console.log(`📊 Total users in database: ${userCount}`)
    
    if (userDuration > 5000) {
      console.warn('⚠️  WARNING: User query took more than 5 seconds. This may cause login timeouts.')
    }
    
    await prisma.$disconnect()
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Database connection failed!')
    console.error('Error:', error.message)
    console.error('Code:', error.code)
    
    if (error.code === 'P1001') {
      console.error('\n💡 This usually means:')
      console.error('   - Database server is not reachable')
      console.error('   - Wrong host/port in DATABASE_URL')
      console.error('   - Firewall blocking connection')
    } else if (error.code === 'P1000') {
      console.error('\n💡 This usually means:')
      console.error('   - Wrong username or password')
      console.error('   - Database credentials are incorrect')
    } else if (error.code === 'P1002' || error.message.includes('pooler') || error.message.includes('max clients')) {
      console.error('\n💡 This usually means:')
      console.error('   - Connection pool is full')
      console.error('   - Too many concurrent connections')
      console.error('   - Supabase free tier limit reached')
    }
    
    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
}

testConnection()
