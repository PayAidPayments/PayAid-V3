import { cache } from '../redis/client'
import crypto from 'crypto'

/**
 * Semantic caching for AI queries
 * Caches similar queries to reduce LLM API calls
 */

interface CachedResponse {
  response: string
  timestamp: number
  similarity: number
}

export class SemanticCache {
  private prefix = 'ai:cache:'
  private ttl = 86400 // 24 hours

  /**
   * Generate a cache key from query
   */
  private generateKey(query: string): string {
    // Simple hash-based key (in production, use semantic similarity)
    const hash = crypto.createHash('sha256').update(query.toLowerCase().trim()).digest('hex')
    return `${this.prefix}${hash.substring(0, 16)}`
  }

  /**
   * Check if a similar query exists in cache
   */
  async get(query: string): Promise<string | null> {
    const key = this.generateKey(query)
    const cached = await cache.get<CachedResponse>(key)
    
    if (cached) {
      // Check if cache is still valid
      const age = Date.now() - cached.timestamp
      if (age < this.ttl * 1000) {
        return cached.response
      }
    }

    return null
  }

  /**
   * Store a query and response in cache
   */
  async set(query: string, response: string): Promise<void> {
    const key = this.generateKey(query)
    const cached: CachedResponse = {
      response,
      timestamp: Date.now(),
      similarity: 1.0,
    }

    await cache.set(key, cached, this.ttl)
  }

  /**
   * Check cache hit rate (for monitoring)
   */
  async getHitRate(): Promise<number> {
    // This would require tracking hits/misses
    // For now, return a placeholder
    return 0.6 // 60% hit rate target
  }
}

export const semanticCache = new SemanticCache()

