import { NextRequest, NextResponse } from 'next/server'
import { getSessionToken } from '@/packages/auth-sdk/client'
import { publishEvent, getEventHistory, verifyRedisConnection } from '@/lib/redis/events'
import {
  getMemoryEventQueue,
  handleGatewayEvent,
  notifyInMemorySubscribers,
  pushToMemoryQueue,
} from '@/lib/events/inter-module-gateway'

/**
 * API Gateway - Event Handler
 *
 * Inter-module communication: POST events, GET history / Redis verify.
 */

export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let tenantId: string | undefined
    let userId: string | undefined

    try {
      const authHeader = request.headers.get('Authorization')
      if (authHeader) {
        // Token present; events may originate from any module
      }
    } catch {
      // ignore
    }

    const body = await request.json()
    const { event, data, module } = body

    if (!event || !data) {
      return NextResponse.json({ error: 'Missing event or data' }, { status: 400 })
    }

    console.log(`[API Gateway] Event received: ${event}`, {
      module: module || 'unknown',
      timestamp: new Date().toISOString(),
    })

    const redisPublished = await publishEvent({
      event,
      data,
      module: module || 'unknown',
      tenantId,
      userId,
    })

    if (!redisPublished) {
      pushToMemoryQueue({
        event,
        data,
        timestamp: new Date(),
        module: module || 'unknown',
      })

      notifyInMemorySubscribers(event, data)
    }

    await handleGatewayEvent(event, data)

    return NextResponse.json({
      success: true,
      message: `Event ${event} processed`,
      redisPublished,
    })
  } catch (error) {
    console.error('[API Gateway] Error processing event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const event = searchParams.get('event')
    const since = searchParams.get('since')
    const action = searchParams.get('action')

    if (action === 'verify') {
      const status = await verifyRedisConnection()
      const eventQueue = getMemoryEventQueue()
      return NextResponse.json({
        redis: status,
        inMemoryFallback: eventQueue.length > 0,
      })
    }

    try {
      const redisEvents = await getEventHistory(event || undefined, 100)

      if (redisEvents.length > 0) {
        if (since) {
          const sinceDate = new Date(since)
          const filtered = redisEvents.filter((e) => new Date(e.timestamp || 0) >= sinceDate)
          return NextResponse.json({
            events: filtered,
            count: filtered.length,
            source: 'redis',
          })
        }

        return NextResponse.json({
          events: redisEvents,
          count: redisEvents.length,
          source: 'redis',
        })
      }
    } catch {
      console.warn('[API Gateway] Redis history not available, using in-memory fallback')
    }

    const eventQueue = getMemoryEventQueue()
    const sinceDate = since ? new Date(since) : new Date(0)
    const filteredEvents = eventQueue.filter(
      (e) => (!event || e.event === event) && e.timestamp >= sinceDate
    )

    return NextResponse.json({
      events: filteredEvents,
      count: filteredEvents.length,
      source: 'memory',
    })
  } catch (error) {
    console.error('[API Gateway] Error fetching events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
