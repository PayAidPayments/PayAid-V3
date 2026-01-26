/**
 * Metrics Collector Service
 * Zero-cost enhancement for observability
 */

import { logger } from '@/lib/logging/structured-logger'

export interface Metric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

class MetricsCollector {
  private metrics: Metric[] = []
  private maxMetrics = 5000

  /**
   * Record a metric
   */
  record(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    }

    this.metrics.push(metric)

    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
  }

  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.record(name, value, tags)
  }

  /**
   * Record timing
   */
  timing(name: string, duration: number, tags?: Record<string, string>): void {
    this.record(name, duration, tags)
  }

  /**
   * Get metrics summary
   */
  getSummary(timeWindow?: number): Record<string, { count: number; sum: number; avg: number; min: number; max: number }> {
    const now = Date.now()
    const cutoff = timeWindow ? now - timeWindow : 0

    const filtered = this.metrics.filter((m) => m.timestamp >= cutoff)
    const byName = new Map<string, number[]>()

    filtered.forEach((metric) => {
      if (!byName.has(metric.name)) {
        byName.set(metric.name, [])
      }
      byName.get(metric.name)!.push(metric.value)
    })

    const summary: Record<string, { count: number; sum: number; avg: number; min: number; max: number }> = {}

    byName.forEach((values, name) => {
      const sorted = values.sort((a, b) => a - b)
      summary[name] = {
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
      }
    })

    return summary
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = []
  }
}

export const metricsCollector = new MetricsCollector()
