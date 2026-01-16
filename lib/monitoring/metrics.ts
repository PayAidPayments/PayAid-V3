/**
 * API Metrics and Monitoring
 * 
 * Tracks API performance metrics for monitoring and optimization.
 * In production, integrate with StatsD, Prometheus, or APM tools.
 */

interface MetricData {
  endpoint: string
  duration: number
  status: number
  timestamp: number
}

// In-memory metrics store (for development)
// In production, send to StatsD, Prometheus, or APM service
const metricsStore: MetricData[] = []
const MAX_METRICS_STORE_SIZE = 1000

/**
 * Track API call metrics
 */
export function trackAPICall(
  endpoint: string,
  duration: number,
  status: number
): void {
  const metric: MetricData = {
    endpoint,
    duration,
    status,
    timestamp: Date.now(),
  }

  // Store metric
  metricsStore.push(metric)

  // Keep store size manageable
  if (metricsStore.length > MAX_METRICS_STORE_SIZE) {
    metricsStore.shift() // Remove oldest
  }

  // Log slow requests (> 1 second)
  if (duration > 1000) {
    console.warn(`[Slow Request] ${endpoint} took ${duration}ms (status: ${status})`)
  }

  // Log errors (4xx, 5xx)
  if (status >= 400) {
    console.warn(`[API Error] ${endpoint} returned ${status} (duration: ${duration}ms)`)
  }

  // In production, send to monitoring service
  if (process.env.STATSD_HOST) {
    sendToStatsD(endpoint, duration, status)
  }

  if (process.env.APM_SERVER_URL) {
    sendToAPM(endpoint, duration, status)
  }
  
  // Also use the new StatsD integration
  try {
    const { trackAPICall: trackStatsD } = require('./statsd')
    trackStatsD(endpoint, duration, status)
  } catch {
    // StatsD not available - silently fail
  }
}

/**
 * Get metrics for an endpoint
 */
export function getEndpointMetrics(endpoint: string, timeWindow: number = 3600000): {
  count: number
  avgDuration: number
  p50: number
  p95: number
  p99: number
  errorRate: number
  statusCounts: Record<number, number>
} {
  const now = Date.now()
  const cutoff = now - timeWindow

  const relevantMetrics = metricsStore.filter(
    (m) => m.endpoint === endpoint && m.timestamp >= cutoff
  )

  if (relevantMetrics.length === 0) {
    return {
      count: 0,
      avgDuration: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      errorRate: 0,
      statusCounts: {},
    }
  }

  const durations = relevantMetrics.map((m) => m.duration).sort((a, b) => a - b)
  const errors = relevantMetrics.filter((m) => m.status >= 400).length

  const statusCounts: Record<number, number> = {}
  relevantMetrics.forEach((m) => {
    statusCounts[m.status] = (statusCounts[m.status] || 0) + 1
  })

  return {
    count: relevantMetrics.length,
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    p50: durations[Math.floor(durations.length * 0.5)],
    p95: durations[Math.floor(durations.length * 0.95)],
    p99: durations[Math.floor(durations.length * 0.99)],
    errorRate: errors / relevantMetrics.length,
    statusCounts,
  }
}

/**
 * Get all metrics summary
 */
export function getAllMetrics(timeWindow: number = 3600000): {
  totalRequests: number
  avgResponseTime: number
  errorRate: number
  topEndpoints: Array<{ endpoint: string; count: number }>
} {
  const now = Date.now()
  const cutoff = now - timeWindow

  const relevantMetrics = metricsStore.filter((m) => m.timestamp >= cutoff)

  if (relevantMetrics.length === 0) {
    return {
      totalRequests: 0,
      avgResponseTime: 0,
      errorRate: 0,
      topEndpoints: [],
    }
  }

  const endpointCounts: Record<string, number> = {}
  let totalDuration = 0
  let errorCount = 0

  relevantMetrics.forEach((m) => {
    endpointCounts[m.endpoint] = (endpointCounts[m.endpoint] || 0) + 1
    totalDuration += m.duration
    if (m.status >= 400) {
      errorCount++
    }
  })

  const topEndpoints = Object.entries(endpointCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, count }))

  return {
    totalRequests: relevantMetrics.length,
    avgResponseTime: totalDuration / relevantMetrics.length,
    errorRate: errorCount / relevantMetrics.length,
    topEndpoints,
  }
}

/**
 * Send metrics to StatsD (if configured)
 */
function sendToStatsD(endpoint: string, duration: number, status: number): void {
  // Use the StatsD integration
  try {
    const { trackAPICall } = require('./statsd')
    trackAPICall(endpoint, duration, status)
  } catch (error) {
    // StatsD not available - silently fail
  }
}

/**
 * Send metrics to APM (if configured)
 */
function sendToAPM(endpoint: string, duration: number, status: number): void {
  // TODO: Implement APM client
  // const apm = require('@elastic/apm-node')
  // if (duration > 1000) {
  //   apm.captureError(new Error(`Slow request: ${endpoint} (${duration}ms)`))
  // }
}

/**
 * Clear metrics store
 */
export function clearMetrics(): void {
  metricsStore.length = 0
}
