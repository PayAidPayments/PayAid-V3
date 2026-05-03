import { getRedisClient } from './client'

/**
 * Redis Event Bus for Inter-Module Communication
 * 
 * This module provides event publishing and subscription using Redis pub/sub
 * for decoupled architecture where modules communicate via events.
 */

export interface EventPayload {
  event: string
  data: any
  module: string
  timestamp?: string
  tenantId?: string
  userId?: string
}

/**
 * Publish an event to Redis
 */
export async function publishEvent(payload: EventPayload): Promise<boolean> {
  try {
    const redis = getRedisClient()
    
    // Ensure Redis is connected
    if (!redis.status || redis.status !== 'ready') {
      try {
        await redis.connect()
      } catch (error) {
        console.warn('[Event Bus] Redis not available, event not published:', payload.event)
        return false
      }
    }

    const eventData = {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    }

    // Publish to Redis channel
    await redis.publish('payaid:events', JSON.stringify(eventData))
    
    // Also store in a list for event history (last 1000 events)
    await redis.lpush('payaid:events:history', JSON.stringify(eventData))
    await redis.ltrim('payaid:events:history', 0, 999) // Keep last 1000 events
    
    console.log(`[Event Bus] Event published: ${payload.event} from ${payload.module}`)
    return true
  } catch (error) {
    console.error('[Event Bus] Error publishing event:', error)
    return false
  }
}

/**
 * Subscribe to events from Redis
 */
export async function subscribeToEvents(
  handler: (payload: EventPayload) => Promise<void> | void
): Promise<() => void> {
  try {
    const redis = getRedisClient()
    
    // Ensure Redis is connected
    if (!redis.status || redis.status !== 'ready') {
      try {
        await redis.connect()
      } catch (error) {
        console.warn('[Event Bus] Redis not available, subscription not active')
        return () => {} // Return no-op unsubscribe function
      }
    }

    // Create a subscriber client (separate from publisher)
    const subscriber = redis.duplicate()
    await subscriber.connect()
    
    // Subscribe to events channel
    await subscriber.subscribe('payaid:events')
    
    // Handle messages
    subscriber.on('message', async (channel, message) => {
      try {
        const payload: EventPayload = JSON.parse(message)
        await handler(payload)
      } catch (error) {
        console.error('[Event Bus] Error handling event:', error)
      }
    })

    // Return unsubscribe function
    return async () => {
      try {
        await subscriber.unsubscribe('payaid:events')
        await subscriber.quit()
      } catch (error) {
        console.error('[Event Bus] Error unsubscribing:', error)
      }
    }
  } catch (error) {
    console.error('[Event Bus] Error subscribing to events:', error)
    return () => {} // Return no-op unsubscribe function
  }
}

/**
 * Get event history from Redis
 */
export async function getEventHistory(
  event?: string,
  limit: number = 100
): Promise<EventPayload[]> {
  try {
    const redis = getRedisClient()
    
    if (!redis.status || redis.status !== 'ready') {
      try {
        await redis.connect()
      } catch (error) {
        console.warn('[Event Bus] Redis not available, returning empty history')
        return []
      }
    }

    const events = await redis.lrange('payaid:events:history', 0, limit - 1)
    
    const parsed = events
      .map((e) => {
        try {
          return JSON.parse(e) as EventPayload
        } catch {
          return null
        }
      })
      .filter((e): e is EventPayload => e !== null)
      .reverse() // Most recent first

    // Filter by event type if specified
    if (event) {
      return parsed.filter((e) => e.event === event)
    }

    return parsed
  } catch (error) {
    console.error('[Event Bus] Error getting event history:', error)
    return []
  }
}

/**
 * Verify Redis connection
 */
export async function verifyRedisConnection(): Promise<{
  connected: boolean
  error?: string
}> {
  try {
    const redis = getRedisClient()
    
    if (!redis.status || redis.status !== 'ready') {
      try {
        await redis.connect()
        await redis.ping()
        return { connected: true }
      } catch (error: any) {
        return {
          connected: false,
          error: error.message || 'Redis connection failed',
        }
      }
    }

    // Test with a ping
    await redis.ping()
    return { connected: true }
  } catch (error: any) {
    return {
      connected: false,
      error: error.message || 'Redis connection failed',
    }
  }
}

