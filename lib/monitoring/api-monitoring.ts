import { NextRequest, NextResponse } from 'next/server'

export interface APIMetric {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  timestamp: Date
  tenantId?: string
  userId?: string
}

// In-memory store (in production, use Redis or database)
const metrics: APIMetric[] = []
const MAX_METRICS = 10000 // Keep last 10k requests

/**
 * Record API response time
 */
export function recordAPIMetric(metric: APIMetric): void {
  metrics.push(metric)
  // Keep only last MAX_METRICS
  if (metrics.length > MAX_METRICS) {
    metrics.shift()
  }
}

/**
 * Get API performance metrics
 */
export function getAPIMetrics(options?: {
  endpoint?: string
  method?: string
  startTime?: Date
  endTime?: Date
  tenantId?: string
}): {
  total: number
  averageResponseTime: number
  p50: number
  p95: number
  p99: number
  errors: number
  byEndpoint: Record<string, {
    count: number
    avgResponseTime: number
    errors: number
  }>
} {
  let filtered = [...metrics]

  if (options?.endpoint) {
    filtered = filtered.filter((m) => m.endpoint === options.endpoint)
  }
  if (options?.method) {
    filtered = filtered.filter((m) => m.method === options.method)
  }
  if (options?.startTime) {
    filtered = filtered.filter((m) => m.timestamp >= options.startTime!)
  }
  if (options?.endTime) {
    filtered = filtered.filter((m) => m.timestamp <= options.endTime!)
  }
  if (options?.tenantId) {
    filtered = filtered.filter((m) => m.tenantId === options.tenantId)
  }

  if (filtered.length === 0) {
    return {
      total: 0,
      averageResponseTime: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      errors: 0,
      byEndpoint: {},
    }
  }

  const responseTimes = filtered.map((m) => m.responseTime).sort((a, b) => a - b)
  const errors = filtered.filter((m) => m.statusCode >= 400).length

  const averageResponseTime =
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
  const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)]
  const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)]
  const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)]

  // Group by endpoint
  const byEndpoint: Record<string, { count: number; avgResponseTime: number; errors: number }> = {}
  filtered.forEach((metric) => {
    const key = `${metric.method} ${metric.endpoint}`
    if (!byEndpoint[key]) {
      byEndpoint[key] = { count: 0, avgResponseTime: 0, errors: 0 }
    }
    byEndpoint[key].count++
    byEndpoint[key].avgResponseTime += metric.responseTime
    if (metric.statusCode >= 400) {
      byEndpoint[key].errors++
    }
  })

  // Calculate averages
  Object.keys(byEndpoint).forEach((key) => {
    byEndpoint[key].avgResponseTime =
      byEndpoint[key].avgResponseTime / byEndpoint[key].count
  })

  return {
    total: filtered.length,
    averageResponseTime,
    p50,
    p95,
    p99,
    errors,
    byEndpoint,
  }
}

/**
 * Middleware to measure API response time
 */
export function withAPIMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const url = new URL(request.url)
    const endpoint = url.pathname
    const method = request.method

    try {
      const response = await handler(request)
      const responseTime = Date.now() - startTime

      // Extract tenant ID and user ID from headers if available
      const tenantId = request.headers.get('x-tenant-id') || undefined
      const userId = request.headers.get('x-user-id') || undefined

      recordAPIMetric({
        endpoint,
        method,
        responseTime,
        statusCode: response.status,
        timestamp: new Date(),
        tenantId,
        userId,
      })

      return response
    } catch (error) {
      const responseTime = Date.now() - startTime
      recordAPIMetric({
        endpoint,
        method,
        responseTime,
        statusCode: 500,
        timestamp: new Date(),
      })
      throw error
    }
  }
}
