/**
 * StatsD Integration for Metrics
 * 
 * Sends metrics to StatsD server for monitoring.
 * Falls back gracefully if StatsD is not configured.
 */

let statsdClient: any = null
let isEnabled = false

/**
 * Initialize StatsD client
 */
export function initializeStatsD() {
  if (process.env.STATSD_HOST && process.env.STATSD_PORT) {
    try {
      // @ts-ignore - webpack will ignore this module
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const StatsD = require('node-statsd')
      
      statsdClient = new StatsD({
        host: process.env.STATSD_HOST,
        port: parseInt(process.env.STATSD_PORT || '8125', 10),
        prefix: process.env.STATSD_PREFIX || 'payaid',
        cacheDns: true,
        mock: false,
      })

      isEnabled = true
      console.log(`✅ StatsD initialized: ${process.env.STATSD_HOST}:${process.env.STATSD_PORT}`)
    } catch (error) {
      console.warn('⚠️ StatsD not available (node-statsd not installed or error):', error)
      isEnabled = false
    }
  } else {
    console.log('ℹ️ StatsD not configured (STATSD_HOST not set)')
    isEnabled = false
  }
}

/**
 * Send timing metric
 */
export function timing(metric: string, value: number, tags?: string[]): void {
  if (!isEnabled || !statsdClient) return
  
  try {
    statsdClient.timing(metric, value, tags)
  } catch (error) {
    // Silently fail - metrics are not critical
  }
}

/**
 * Increment counter
 */
export function increment(metric: string, value: number = 1, tags?: string[]): void {
  if (!isEnabled || !statsdClient) return
  
  try {
    statsdClient.increment(metric, value, tags)
  } catch (error) {
    // Silently fail
  }
}

/**
 * Decrement counter
 */
export function decrement(metric: string, value: number = 1, tags?: string[]): void {
  if (!isEnabled || !statsdClient) return
  
  try {
    statsdClient.decrement(metric, value, tags)
  } catch (error) {
    // Silently fail
  }
}

/**
 * Set gauge value
 */
export function gauge(metric: string, value: number, tags?: string[]): void {
  if (!isEnabled || !statsdClient) return
  
  try {
    statsdClient.gauge(metric, value, tags)
  } catch (error) {
    // Silently fail
  }
}

/**
 * Track API call metrics
 */
export function trackAPICall(endpoint: string, duration: number, status: number): void {
  const tags = [`endpoint:${endpoint}`, `status:${status}`]
  
  // Timing
  timing(`api.${endpoint}.duration`, duration, tags)
  timing('api.duration', duration, tags)
  
  // Counter
  increment(`api.${endpoint}.${status}`, 1, tags)
  increment('api.total_requests', 1, tags)
  
  // Error tracking
  if (status >= 400) {
    increment(`api.${endpoint}.errors`, 1, tags)
    increment('api.total_errors', 1, tags)
  }
  
  // Success tracking
  if (status < 400) {
    increment(`api.${endpoint}.success`, 1, tags)
  }
}

/**
 * Track cache metrics
 */
export function trackCacheHit(endpoint: string, cacheLayer: 'L1' | 'L2'): void {
  increment(`cache.${endpoint}.hit`, 1, [`layer:${cacheLayer}`])
  increment('cache.total_hits', 1, [`layer:${cacheLayer}`])
}

export function trackCacheMiss(endpoint: string): void {
  increment(`cache.${endpoint}.miss`, 1)
  increment('cache.total_misses', 1)
}

/**
 * Track database metrics
 */
export function trackDatabaseQuery(query: string, duration: number, success: boolean): void {
  const tags = [`query:${query}`, `success:${success}`]
  
  timing('db.query.duration', duration, tags)
  increment('db.total_queries', 1, tags)
  
  if (!success) {
    increment('db.query.errors', 1, tags)
  }
}

/**
 * Track rate limit hits
 */
export function trackRateLimit(tenantId: string, limitType: 'tenant' | 'user' | 'ip'): void {
  increment('rate_limit.hits', 1, [`type:${limitType}`, `tenant:${tenantId}`])
}

// Initialize on module load
if (typeof window === 'undefined') {
  initializeStatsD()
}
