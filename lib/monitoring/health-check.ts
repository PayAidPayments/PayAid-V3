/**
 * Health Check Service
 * Zero-cost enhancement for observability and monitoring
 */

import { prisma } from '@/lib/db/prisma'
import { Redis } from 'ioredis'
import { logger } from '@/lib/logging/structured-logger'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    database: { status: 'up' | 'down'; latency?: number; error?: string }
    cache: { status: 'up' | 'down'; latency?: number; error?: string }
    api: { status: 'up' | 'down'; latency?: number }
  }
  version: string
  uptime: number
}

let redis: Redis | null = null
try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL)
  }
} catch (error) {
  // Redis not available
}

export class HealthCheckService {
  /**
   * Perform comprehensive health check
   */
  static async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now()
    const checks = {
      database: await this.checkDatabase(),
      cache: await this.checkCache(),
      api: { status: 'up' as const, latency: Date.now() - startTime },
    }

    const allHealthy = Object.values(checks).every((check) => check.status === 'up')
    const anyDegraded = Object.values(checks).some((check) => check.status === 'down')

    const status: HealthStatus['status'] = allHealthy
      ? 'healthy'
      : anyDegraded
        ? 'unhealthy'
        : 'degraded'

    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
    }
  }

  /**
   * Check database connectivity
   */
  private static async checkDatabase(): Promise<{
    status: 'up' | 'down'
    latency?: number
    error?: string
  }> {
    try {
      const startTime = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const latency = Date.now() - startTime

      return {
        status: 'up',
        latency,
      }
    } catch (error) {
      logger.error('Database health check failed', error instanceof Error ? error : undefined)
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check cache (Redis) connectivity
   */
  private static async checkCache(): Promise<{
    status: 'up' | 'down'
    latency?: number
    error?: string
  }> {
    if (!redis) {
      return {
        status: 'down',
        error: 'Redis not configured',
      }
    }

    try {
      const startTime = Date.now()
      await redis.ping()
      const latency = Date.now() - startTime

      return {
        status: 'up',
        latency,
      }
    } catch (error) {
      logger.error('Cache health check failed', error instanceof Error ? error : undefined)
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get system metrics
   */
  static async getMetrics(): Promise<{
    memory: NodeJS.MemoryUsage
    cpu: { usage: number }
    activeConnections: number
  }> {
    const memory = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    // Get active database connections (approximate)
    let activeConnections = 0
    try {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
      `
      activeConnections = Number(result[0]?.count || 0)
    } catch (error) {
      // Ignore errors
    }

    return {
      memory,
      cpu: {
        usage: cpuUsage.user + cpuUsage.system,
      },
      activeConnections,
    }
  }
}
