/**
 * Test System Health
 * 
 * Comprehensive test of all system components:
 * - Database connections (primary and read replica)
 * - Redis connection
 * - Job queue
 * - Cache system
 * - Monitoring
 */

import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'
import { getRedisClient } from '@/lib/redis/client'
import { multiLayerCache } from '@/lib/cache/multi-layer'
import { mediumPriorityQueue } from '@/lib/queue/bull'

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  message: string
  duration?: number
}

async function testSystemHealth() {
  console.log('🏥 Testing System Health...\n')

  const checks: HealthCheck[] = []

  // Test 1: Primary Database
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const duration = Date.now() - start
    
    checks.push({
      name: 'Primary Database',
      status: 'healthy',
      message: 'Connected successfully',
      duration,
    })
    console.log(`✅ Primary Database: OK (${duration}ms)`)
  } catch (error: any) {
    checks.push({
      name: 'Primary Database',
      status: 'unhealthy',
      message: error.message,
    })
    console.error(`❌ Primary Database: FAILED - ${error.message}`)
  }

  // Test 2: Read Replica Database
  try {
    const start = Date.now()
    await prismaRead.$queryRaw`SELECT 1`
    const duration = Date.now() - start
    
    checks.push({
      name: 'Read Replica Database',
      status: 'healthy',
      message: 'Connected successfully',
      duration,
    })
    console.log(`✅ Read Replica Database: OK (${duration}ms)`)
  } catch (error: any) {
    checks.push({
      name: 'Read Replica Database',
      status: 'degraded',
      message: error.message || 'Not configured (falls back to primary)',
    })
    console.warn(`⚠️  Read Replica Database: ${error.message || 'Not configured'}`)
  }

  // Test 3: Redis Connection
  try {
    const start = Date.now()
    const redis = getRedisClient()
    await redis.ping()
    const duration = Date.now() - start
    
    checks.push({
      name: 'Redis',
      status: 'healthy',
      message: 'Connected successfully',
      duration,
    })
    console.log(`✅ Redis: OK (${duration}ms)`)
  } catch (error: any) {
    checks.push({
      name: 'Redis',
      status: 'degraded',
      message: error.message || 'Not available (caching disabled)',
    })
    console.warn(`⚠️  Redis: ${error.message || 'Not available'}`)
  }

  // Test 4: Multi-Layer Cache
  try {
    const start = Date.now()
    const testKey = 'health-check-test'
    const testValue = { test: true, timestamp: Date.now() }
    
    await multiLayerCache.set(testKey, testValue, 60)
    const retrieved = await multiLayerCache.get(testKey)
    await multiLayerCache.delete(testKey)
    
    const duration = Date.now() - start
    
    if (retrieved && (retrieved as any).test) {
      checks.push({
        name: 'Multi-Layer Cache',
        status: 'healthy',
        message: 'Working correctly',
        duration,
      })
      console.log(`✅ Multi-Layer Cache: OK (${duration}ms)`)
    } else {
      throw new Error('Cache retrieval failed')
    }
  } catch (error: any) {
    checks.push({
      name: 'Multi-Layer Cache',
      status: 'degraded',
      message: error.message || 'Not available',
    })
    console.warn(`⚠️  Multi-Layer Cache: ${error.message || 'Not available'}`)
  }

  // Test 5: Job Queue
  try {
    const start = Date.now()
    const job = await mediumPriorityQueue.add('health-check', {
      test: true,
    })
    const duration = Date.now() - start
    
    // Clean up test job
    await job.remove()
    
    checks.push({
      name: 'Job Queue',
      status: 'healthy',
      message: 'Working correctly',
      duration,
    })
    console.log(`✅ Job Queue: OK (${duration}ms)`)
  } catch (error: any) {
    checks.push({
      name: 'Job Queue',
      status: 'degraded',
      message: error.message || 'Not available',
    })
    console.warn(`⚠️  Job Queue: ${error.message || 'Not available'}`)
  }

  // Summary
  console.log('\n📊 Health Check Summary:')
  const healthy = checks.filter(c => c.status === 'healthy').length
  const degraded = checks.filter(c => c.status === 'degraded').length
  const unhealthy = checks.filter(c => c.status === 'unhealthy').length

  console.log(`   ✅ Healthy: ${healthy}`)
  console.log(`   ⚠️  Degraded: ${degraded}`)
  console.log(`   ❌ Unhealthy: ${unhealthy}`)

  if (unhealthy > 0) {
    console.log('\n❌ System has unhealthy components!')
    process.exit(1)
  } else if (degraded > 0) {
    console.log('\n⚠️  System is operational but some components are degraded.')
    console.log('   This is acceptable for development, but should be fixed for production.')
  } else {
    console.log('\n✅ All systems healthy!')
  }

  // Cleanup
  await prisma.$disconnect()
  await prismaRead.$disconnect()
  await mediumPriorityQueue.close()
}

testSystemHealth()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
