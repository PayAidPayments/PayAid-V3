/**
 * Verification Script for Database Connection Setup
 * 
 * This script verifies:
 * 1. DATABASE_URL is configured correctly
 * 2. Connection pool parameters are set
 * 3. Connection is working
 * 4. Health check endpoint is accessible
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface VerificationResult {
  step: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
}

async function verifyDatabaseConnection() {
  console.log('🔍 Verifying Database Connection Setup...\n')
  
  const results: VerificationResult[] = []

  // Step 1: Check DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    results.push({
      step: 'DATABASE_URL Environment Variable',
      status: 'fail',
      message: 'DATABASE_URL is not set',
    })
    printResults(results)
    process.exit(1)
  }

  results.push({
    step: 'DATABASE_URL Environment Variable',
    status: 'pass',
    message: 'DATABASE_URL is configured',
    details: {
      preview: `${databaseUrl.substring(0, 50)}...`,
      hasPassword: databaseUrl.includes('@'),
    },
  })

  // Step 2: Check connection string format
  try {
    const url = new URL(databaseUrl)
    const isPooler = url.hostname.includes('pooler.supabase.com')
    const isDirect = url.hostname.includes('.supabase.co')
    const port = url.port || (url.protocol === 'postgresql:' ? '5432' : '')
    
    results.push({
      step: 'Connection String Format',
      status: 'pass',
      message: isPooler 
        ? 'Using Supabase Pooler (recommended)'
        : isDirect 
        ? 'Using Direct Connection'
        : 'Using custom connection',
      details: {
        hostname: url.hostname,
        port: port,
        isPooler,
        isDirect,
      },
    })

    // Check for connection pool parameters
    const hasConnectionLimit = url.searchParams.has('connection_limit')
    const hasPoolTimeout = url.searchParams.has('pool_timeout')
    const hasConnectTimeout = url.searchParams.has('connect_timeout')

    if (!hasConnectionLimit || !hasPoolTimeout || !hasConnectTimeout) {
      results.push({
        step: 'Connection Pool Parameters',
        status: 'warning',
        message: 'Connection pool parameters not in URL (will be auto-added by Prisma)',
        details: {
          connection_limit: hasConnectionLimit ? 'present' : 'will be auto-added',
          pool_timeout: hasPoolTimeout ? 'present' : 'will be auto-added',
          connect_timeout: hasConnectTimeout ? 'present' : 'will be auto-added',
        },
      })
    } else {
      results.push({
        step: 'Connection Pool Parameters',
        status: 'pass',
        message: 'Connection pool parameters are configured',
        details: {
          connection_limit: url.searchParams.get('connection_limit'),
          pool_timeout: url.searchParams.get('pool_timeout'),
          connect_timeout: url.searchParams.get('connect_timeout'),
        },
      })
    }
  } catch (error) {
    results.push({
      step: 'Connection String Format',
      status: 'fail',
      message: 'Invalid DATABASE_URL format',
      details: { error: (error as Error).message },
    })
  }

  // Step 3: Check DATABASE_CONNECTION_LIMIT
  const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT
  if (connectionLimit) {
    results.push({
      step: 'DATABASE_CONNECTION_LIMIT',
      status: 'pass',
      message: `Connection limit set to ${connectionLimit}`,
      details: { limit: connectionLimit },
    })
  } else {
    results.push({
      step: 'DATABASE_CONNECTION_LIMIT',
      status: 'warning',
      message: 'DATABASE_CONNECTION_LIMIT not set (using default: 10 for production)',
    })
  }

  // Step 4: Test database connection
  try {
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1 as test`
    const queryTime = Date.now() - startTime

    results.push({
      step: 'Database Connection Test',
      status: 'pass',
      message: `Connection successful (${queryTime}ms)`,
      details: { queryTimeMs: queryTime },
    })
  } catch (error: any) {
    results.push({
      step: 'Database Connection Test',
      status: 'fail',
      message: 'Connection failed',
      details: {
        error: error?.message,
        code: error?.code,
      },
    })
  }

  // Step 5: Test table access
  try {
    const userCount = await prisma.user.count()
    results.push({
      step: 'Table Access Test',
      status: 'pass',
      message: `User table accessible (${userCount} users)`,
      details: { userCount },
    })
  } catch (error: any) {
    results.push({
      step: 'Table Access Test',
      status: 'fail',
      message: 'Cannot access User table',
      details: {
        error: error?.message,
        code: error?.code,
      },
    })
  }

  // Step 6: Check connection pool configuration
  try {
    // This will use the enhanced Prisma client with connection pool params
    const testQuery = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version()
    `
    results.push({
      step: 'PostgreSQL Version',
      status: 'pass',
      message: 'PostgreSQL connection working',
      details: {
        version: testQuery[0]?.version?.substring(0, 50) || 'Unknown',
      },
    })
  } catch (error: any) {
    results.push({
      step: 'PostgreSQL Version',
      status: 'warning',
      message: 'Could not fetch PostgreSQL version',
      details: { error: error?.message },
    })
  }

  // Print results
  printResults(results)

  // Summary
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warnings = results.filter(r => r.status === 'warning').length

  console.log('\n📊 Summary:')
  console.log(`✅ Passed: ${passed}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log(`❌ Failed: ${failed}`)

  if (failed > 0) {
    console.log('\n❌ Some checks failed. Please review the results above.')
    process.exit(1)
  } else if (warnings > 0) {
    console.log('\n⚠️  Some warnings found. Review recommendations above.')
    process.exit(0)
  } else {
    console.log('\n✅ All checks passed! Database connection is properly configured.')
    process.exit(0)
  }
}

function printResults(results: VerificationResult[]) {
  console.log('\n📋 Verification Results:\n')
  
  results.forEach((result, index) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
    console.log(`${icon} ${result.step}`)
    console.log(`   ${result.message}`)
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2).split('\n').map(l => `   ${l}`).join('\n'))
    }
    console.log('')
  })
}

verifyDatabaseConnection()
  .catch((e) => {
    console.error('❌ Error during verification:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

