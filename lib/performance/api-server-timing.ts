/**
 * Server-side API timing and performance tracking.
 * Creates Server-Timing headers for waterfall inspection and structured logs.
 */

export type TimingPhase = 'auth' | 'db' | 'external' | 'serialize' | 'cache'

export interface ServerTiming {
  start(phase: TimingPhase): void
  end(phase: TimingPhase): void
  markCache(hit: boolean): void
  toHeaders(): string
  toLogMeta(): Record<string, number | string>
}

interface PhaseMetric {
  start: number
  duration?: number
}

export function createServerTiming(): ServerTiming {
  const phases = new Map<TimingPhase, PhaseMetric>()
  let cacheStatus: 'hit' | 'miss' | null = null
  const startTime = Date.now()

  return {
    start(phase: TimingPhase) {
      if (!phases.has(phase)) {
        phases.set(phase, { start: Date.now() })
      }
    },

    end(phase: TimingPhase) {
      const metric = phases.get(phase)
      if (metric && metric.duration === undefined) {
        metric.duration = Date.now() - metric.start
      }
    },

    markCache(hit: boolean) {
      cacheStatus = hit ? 'hit' : 'miss'
    },

    toHeaders(): string {
      const parts: string[] = []
      
      for (const [phase, metric] of phases.entries()) {
        if (metric.duration !== undefined) {
          parts.push(`${phase};dur=${metric.duration}`)
        }
      }
      
      if (cacheStatus) {
        parts.push(`cache;desc="${cacheStatus}"`)
      }
      
      const totalDuration = Date.now() - startTime
      parts.push(`total;dur=${totalDuration}`)
      
      return parts.join(', ')
    },

    toLogMeta(): Record<string, number | string> {
      const meta: Record<string, number | string> = {}
      
      for (const [phase, metric] of phases.entries()) {
        if (metric.duration !== undefined) {
          meta[`${phase}_ms`] = metric.duration
        }
      }
      
      if (cacheStatus) {
        meta.cache = cacheStatus
      }
      
      meta.total_ms = Date.now() - startTime
      
      return meta
    },
  }
}

/**
 * Cached JSON helper with multiLayerCache integration and timing tracking.
 * Wraps a compute function with cache-or-compute logic.
 */
export async function withCachedJson<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
  timing?: ServerTiming
): Promise<T> {
  const { multiLayerCache } = await import('@/lib/cache/multi-layer')
  
  timing?.start('cache')
  const cached = await multiLayerCache.get<T>(key)
  timing?.end('cache')
  
  if (cached !== null) {
    timing?.markCache(true)
    return cached
  }
  
  timing?.markCache(false)
  const result = await compute()
  
  timing?.start('cache')
  await multiLayerCache.set(key, result, ttlSeconds)
  timing?.end('cache')
  
  return result
}
