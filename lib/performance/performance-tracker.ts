/**
 * Performance Tracking Service
 * Zero-cost enhancement for observability
 */

import { logger } from '@/lib/logging/structured-logger'

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceTracker {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000 // Keep last 1000 metrics

  /**
   * Track a performance metric
   */
  track(name: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    }

    this.metrics.push(metric)

    // Keep only last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // Log slow operations
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${name} took ${duration}ms`, { metadata })
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    average: Record<string, number>
    p95: Record<string, number>
    p99: Record<string, number>
    slowest: PerformanceMetric[]
  } {
    const byName = new Map<string, number[]>()

    this.metrics.forEach((metric) => {
      if (!byName.has(metric.name)) {
        byName.set(metric.name, [])
      }
      byName.get(metric.name)!.push(metric.duration)
    })

    const average: Record<string, number> = {}
    const p95: Record<string, number> = {}
    const p99: Record<string, number> = {}

    byName.forEach((durations, name) => {
      const sorted = durations.sort((a, b) => a - b)
      average[name] = durations.reduce((a, b) => a + b, 0) / durations.length
      p95[name] = sorted[Math.floor(sorted.length * 0.95)]
      p99[name] = sorted[Math.floor(sorted.length * 0.99)]
    })

    const slowest = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)

    return { average, p95, p99, slowest }
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = []
  }
}

export const performanceTracker = new PerformanceTracker()

/**
 * Performance measurement decorator
 */
export function measurePerformance(name: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime
        performanceTracker.track(name, duration, {
          method: propertyKey,
          success: true,
        })
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        performanceTracker.track(name, duration, {
          method: propertyKey,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        throw error
      }
    }

    return descriptor
  }
}
