/**
 * Simple database connection test (no server-only imports)
 */

import { PrismaClient } from '@prisma/client'

async function testConnection() {
  console.log('🔍 Testing database connection...')
  
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set. Please set it in .env.local')
    process.exit(1)
  }

  console.log('✅ DATABASE_URL is set')
  console.log('   Preview:', databaseUrl.substring(0, 50) + '...')
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

  try {
    console.log('⏳ Attempting to connect...')
    const startTime = Date.now()
    
    // Test basic query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    const duration = Date.now() - startTime
    
    console.log('✅ Database connection successful!')
    console.log(`⏱️  Query took ${duration}ms`)
    console.log('Result:', result)
    
    // Test tenant query
    console.log('\n🔍 Testing tenant query...')
    const tenantStartTime = Date.now()
    const tenantCount = await prisma.tenant.count()
    const tenantDuration = Date.now() - tenantStartTime
    
    console.log(`✅ Tenant query successful!`)
    console.log(`⏱️  Query took ${tenantDuration}ms`)
    console.log(`📊 Total tenants in database: ${tenantCount}`)
    
    await prisma.$disconnect()
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Database connection failed!')
    console.error('Error:', error.message)
    console.error('Code:', error.code)
    
    if (error.code === 'P1001') {
      console.error('\n💡 This is a connection timeout. Possible causes:')
      console.error('   - Supabase project is paused')
      console.error('   - Network connectivity issues')
      console.error('   - Wrong connection string')
    } else if (error.code === 'P1000') {
      console.error('\n💡 This is an authentication error. Possible causes:')
      console.error('   - Wrong password in DATABASE_URL')
      console.error('   - Wrong username')
    }
    
    await prisma.$disconnect()
    process.exit(1)
  }
}

testConnection().catch(console.error)
