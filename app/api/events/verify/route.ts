import { NextRequest, NextResponse } from 'next/server'
import { verifyRedisConnection } from '@/lib/redis/events'
import { getRedisClient } from '@/lib/redis/client'

/**
 * API endpoint to verify Redis Event Bus setup
 * GET /api/events/verify
 */
export async function GET(request: NextRequest) {
  try {
    // Verify Redis connection
    const redisStatus = await verifyRedisConnection()
    
    // Get Redis client info
    const redis = getRedisClient()
    const redisInfo = {
      status: redis.status,
      connected: redisStatus.connected,
      error: redisStatus.error,
    }

    // Test event publishing
    let publishTest = false
    if (redisStatus.connected) {
      try {
        const { publishEvent } = await import('@/lib/redis/events')
        publishTest = await publishEvent({
          event: 'test.verification',
          data: { test: true },
          module: 'system',
        })
      } catch (error) {
        console.error('[Event Bus] Publish test failed:', error)
      }
    }

    return NextResponse.json({
      redis: redisInfo,
      eventBus: {
        publishTest,
        channels: ['payaid:events'],
        historyKey: 'payaid:events:history',
      },
      status: redisStatus.connected && publishTest ? 'operational' : 'degraded',
      message: redisStatus.connected
        ? 'Redis Event Bus is operational'
        : 'Redis Event Bus is using in-memory fallback',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to verify Redis Event Bus',
        message: error.message,
        status: 'error',
      },
      { status: 500 }
    )
  }
}

