/**
 * System Health Check Endpoint
 * 
 * GET /api/system/health
 * Returns health status of all system components
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'
import { getRedisClient } from '@/lib/redis/client'
import { multiLayerCache } from '@/lib/cache/multi-layer'

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  message: string
  duration?: number
}

export async function GET(request: NextRequest) {
  const checks: HealthCheck[] = []
  const startTime = Date.now()

  // Check 1: Primary Database
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.push({
      name: 'Primary Database',
      status: 'healthy',
      message: 'Connected',
      duration: Date.now() - dbStart,
    })
  } catch (error: any) {
    checks.push({
      name: 'Primary Database',
      status: 'unhealthy',
      message: error.message,
    })
  }

  // Check 2: Read Replica Database
  try {
    const dbStart = Date.now()
    await prismaRead.$queryRaw`SELECT 1`
    checks.push({
      name: 'Read Replica Database',
      status: 'healthy',
      message: 'Connected',
      duration: Date.now() - dbStart,
    })
  } catch (error: any) {
    checks.push({
      name: 'Read Replica Database',
      status: 'degraded',
      message: error.message || 'Not configured',
    })
  }

  // Check 3: Redis
  try {
    const redisStart = Date.now()
    const redis = getRedisClient()
    await redis.ping()
    checks.push({
      name: 'Redis',
      status: 'healthy',
      message: 'Connected',
      duration: Date.now() - redisStart,
    })
  } catch (error: any) {
    checks.push({
      name: 'Redis',
      status: 'degraded',
      message: error.message || 'Not available',
    })
  }

  // Check 4: Cache
  try {
    const cacheStart = Date.now()
    const testKey = `health-check-${Date.now()}`
    await multiLayerCache.set(testKey, { test: true }, 10)
    const retrieved = await multiLayerCache.get(testKey)
    await multiLayerCache.delete(testKey)
    
    if (retrieved) {
      checks.push({
        name: 'Multi-Layer Cache',
        status: 'healthy',
        message: 'Working',
        duration: Date.now() - cacheStart,
      })
    } else {
      checks.push({
        name: 'Multi-Layer Cache',
        status: 'degraded',
        message: 'Cache miss',
      })
    }
  } catch (error: any) {
    checks.push({
      name: 'Multi-Layer Cache',
      status: 'degraded',
      message: error.message || 'Not available',
    })
  }

  // Calculate overall status
  const healthy = checks.filter(c => c.status === 'healthy').length
  const degraded = checks.filter(c => c.status === 'degraded').length
  const unhealthy = checks.filter(c => c.status === 'unhealthy').length

  const overallStatus = unhealthy > 0 ? 'unhealthy' : degraded > 0 ? 'degraded' : 'healthy'

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    checks,
    summary: {
      healthy,
      degraded,
      unhealthy,
      total: checks.length,
    },
  }, {
    status: overallStatus === 'unhealthy' ? 503 : overallStatus === 'degraded' ? 200 : 200,
  })
}
