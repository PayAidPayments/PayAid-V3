import { cache } from '../redis/client'

// Simple metrics tracking using Redis
export class Metrics {
  private prefix = 'metrics:'

  async increment(counter: string, value: number = 1): Promise<void> {
    const key = `${this.prefix}${counter}`
    const current = (await cache.get<number>(key)) || 0
    await cache.set(key, current + value, 86400) // 24 hour TTL
  }

  async setGauge(gauge: string, value: number): Promise<void> {
    const key = `${this.prefix}gauge:${gauge}`
    await cache.set(key, value, 3600) // 1 hour TTL
  }

  async recordTiming(timing: string, durationMs: number): Promise<void> {
    const key = `${this.prefix}timing:${timing}`
    const timings = (await cache.get<number[]>(key)) || []
    timings.push(durationMs)
    
    // Keep only last 100 timings
    if (timings.length > 100) {
      timings.shift()
    }
    
    await cache.set(key, timings, 3600)
  }

  async getCounter(counter: string): Promise<number> {
    const key = `${this.prefix}${counter}`
    return (await cache.get<number>(key)) || 0
  }

  async getGauge(gauge: string): Promise<number | null> {
    const key = `${this.prefix}gauge:${gauge}`
    return await cache.get<number>(key)
  }

  async getTimingStats(timing: string): Promise<{
    count: number
    avg: number
    min: number
    max: number
    p95: number
  } | null> {
    const key = `${this.prefix}timing:${timing}`
    const timings = await cache.get<number[]>(key)
    
    if (!timings || timings.length === 0) {
      return null
    }
    
    const sorted = [...timings].sort((a, b) => a - b)
    const sum = sorted.reduce((a, b) => a + b, 0)
    
    return {
      count: sorted.length,
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    }
  }
}

export const metrics = new Metrics()

