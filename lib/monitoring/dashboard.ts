/**
 * Monitoring Dashboard Utilities
 * 
 * Functions to retrieve and format metrics for monitoring dashboards
 */

import { getEndpointMetrics, getAllMetrics } from './metrics'
import { prisma } from '@/lib/db/prisma'
import { getRedisClient } from '@/lib/redis/client'
import { multiLayerCache } from '@/lib/cache/multi-layer'

interface DashboardMetrics {
  api: {
    totalRequests: number
    avgResponseTime: number
    errorRate: number
    topEndpoints: Array<{ endpoint: string; count: number; avgDuration: number }>
  }
  cache: {
    hitRate: number
    totalHits: number
    totalMisses: number
    stats: ReturnType<typeof multiLayerCache.getStats>
  }
  database: {
    primaryConnections: number
    readReplicaConnections: number
    slowQueries: number
  }
  system: {
    timestamp: string
    uptime: number
  }
}

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const startTime = Date.now()

  // Get API metrics
  const apiMetrics = getAllMetrics(3600000) // Last hour

  // Get cache stats
  const cacheStats = multiLayerCache.getStats()
  // Note: getStats() doesn't return hits/misses, only memory size info
  // Cache hit rate would need to be tracked separately if needed
  const cacheHitRate = 0 // TODO: Implement hit/miss tracking if needed

  // Get top endpoints with details
  const topEndpoints = apiMetrics.topEndpoints.map(endpoint => {
    const endpointMetrics = getEndpointMetrics(endpoint.endpoint, 3600000)
    return {
      endpoint: endpoint.endpoint,
      count: endpoint.count,
      avgDuration: endpointMetrics.avgDuration,
      p95: endpointMetrics.p95,
      errorRate: endpointMetrics.errorRate,
    }
  })

  // Get database connection info
  let primaryConnections = 0
  let readReplicaConnections = 0
  let slowQueries = 0

  try {
    // Get connection counts (approximate)
    const dbStats = await prisma.$queryRawUnsafe(`
      SELECT 
        count(*) as active_connections
      FROM pg_stat_activity
      WHERE state = 'active'
    `) as Array<{ active_connections: bigint }>

    primaryConnections = Number(dbStats[0]?.active_connections || 0)

    // Get slow queries count
    const slowQueryStats = await prisma.$queryRawUnsafe(`
      SELECT count(*) as slow_queries
      FROM pg_stat_statements
      WHERE mean_exec_time > 1000
    `) as Array<{ slow_queries: bigint }>

    slowQueries = Number(slowQueryStats[0]?.slow_queries || 0)
  } catch (error) {
    // Database stats not available - silently fail
  }

  return {
    api: {
      totalRequests: apiMetrics.totalRequests,
      avgResponseTime: apiMetrics.avgResponseTime,
      errorRate: apiMetrics.errorRate,
      topEndpoints,
    },
    cache: {
      hitRate: cacheHitRate,
      totalHits: 0, // TODO: Track hits if needed
      totalMisses: 0, // TODO: Track misses if needed
      stats: cacheStats,
    },
    database: {
      primaryConnections,
      readReplicaConnections: 0, // TODO: Get from read replica if available
      slowQueries,
    },
    system: {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
    },
  }
}

/**
 * Get health status for monitoring
 */
export async function getHealthStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: Array<{ name: string; status: string; message: string }>
}> {
  const checks: Array<{ name: string; status: string; message: string }> = []

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.push({ name: 'Database', status: 'healthy', message: 'Connected' })
  } catch (error: any) {
    checks.push({ name: 'Database', status: 'unhealthy', message: error.message })
  }

  // Check Redis
  try {
    const redis = getRedisClient()
    await redis.ping()
    checks.push({ name: 'Redis', status: 'healthy', message: 'Connected' })
  } catch (error: any) {
    checks.push({ name: 'Redis', status: 'degraded', message: error.message || 'Not available' })
  }

  // Check cache
  try {
    const testKey = `health-${Date.now()}`
    await multiLayerCache.set(testKey, { test: true }, 10)
    const retrieved = await multiLayerCache.get(testKey)
    await multiLayerCache.delete(testKey)
    
    if (retrieved) {
      checks.push({ name: 'Cache', status: 'healthy', message: 'Working' })
    } else {
      checks.push({ name: 'Cache', status: 'degraded', message: 'Cache miss' })
    }
  } catch (error: any) {
    checks.push({ name: 'Cache', status: 'degraded', message: error.message || 'Not available' })
  }

  const unhealthy = checks.filter(c => c.status === 'unhealthy').length
  const degraded = checks.filter(c => c.status === 'degraded').length

  const overallStatus = unhealthy > 0 ? 'unhealthy' : degraded > 0 ? 'degraded' : 'healthy'

  return {
    status: overallStatus,
    checks,
  }
}
