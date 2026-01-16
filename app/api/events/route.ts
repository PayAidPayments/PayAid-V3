import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/packages/auth-sdk/client';
import { publishEvent, getEventHistory, verifyRedisConnection } from '@/lib/redis/events';
import { requireModuleAccess } from '@/lib/middleware/license';

/**
 * API Gateway - Event Handler
 * 
 * This endpoint handles inter-module communication events.
 * Modules can post events here, and other modules can subscribe to them.
 * 
 * Events supported:
 * - CRM: contact.created, deal.won, order.created
 * - Finance: invoice.created, payment.received
 * - Sales: lead.created, page_viewed
 */

// In-memory event store (fallback if Redis is not available)
const eventQueue: Array<{
  event: string;
  data: any;
  timestamp: Date;
  module: string;
}> = [];

// Event subscribers (fallback if Redis is not available)
const subscribers: Map<string, Array<(data: any) => Promise<void>>> = new Map();

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = await getSessionToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant info for event (optional)
    let tenantId: string | undefined;
    let userId: string | undefined;
    
    // Try to extract from token or request headers
    try {
      const authHeader = request.headers.get('Authorization');
      if (authHeader) {
        // Token is available, but we don't need to verify module access for events
        // Events can come from any module
      }
    } catch {
      // Continue without tenant/user info
    }

    const body = await request.json();
    const { event, data, module } = body;

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Missing event or data' },
        { status: 400 }
      );
    }

    // Log event
    console.log(`[API Gateway] Event received: ${event}`, {
      module: module || 'unknown',
      timestamp: new Date().toISOString(),
    });

    // Try to publish to Redis first
    const redisPublished = await publishEvent({
      event,
      data,
      module: module || 'unknown',
      tenantId,
      userId,
    });

    // Fallback to in-memory queue if Redis is not available
    if (!redisPublished) {
      eventQueue.push({
        event,
        data,
        timestamp: new Date(),
        module: module || 'unknown',
      });

      // Notify in-memory subscribers
      const eventSubscribers = subscribers.get(event) || [];
      for (const subscriber of eventSubscribers) {
        try {
          await subscriber(data);
        } catch (error) {
          console.error(`[API Gateway] Error in subscriber for ${event}:`, error);
        }
      }
    }

    // Handle specific events synchronously
    await handleEvent(event, data);

    return NextResponse.json({
      success: true,
      message: `Event ${event} processed`,
      redisPublished,
    });
  } catch (error) {
    console.error('[API Gateway] Error processing event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle specific events
 */
async function handleEvent(event: string, data: any) {
  switch (event) {
    case 'order.created':
      // When CRM creates order, notify Finance to create invoice
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/finance/invoices/auto-create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Key': process.env.API_GATEWAY_KEY || 'internal-service-key',
          },
          body: JSON.stringify({
            order_id: data.id,
            customer_id: data.customer_id,
            amount: data.total,
            order_data: data,
          }),
        });
      } catch (error) {
        console.error('[API Gateway] Error creating invoice from order:', error);
      }
      break;

    case 'contact.created':
      // When CRM creates contact, notify Sales module
      console.log('[API Gateway] Contact created, notifying Sales module');
      break;

    case 'deal.won':
      // When deal is won, notify Finance and Sales
      console.log('[API Gateway] Deal won, notifying Finance and Sales modules');
      break;

    case 'invoice.created':
      // When Finance creates invoice, notify CRM
      console.log('[API Gateway] Invoice created, notifying CRM module');
      break;

    case 'payment.received':
      // When payment is received, notify CRM and Finance
      console.log('[API Gateway] Payment received, notifying CRM and Finance modules');
      break;

    default:
      console.log(`[API Gateway] Unhandled event: ${event}`);
  }
}

/**
 * GET endpoint to get event history or verify Redis connection
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event');
    const since = searchParams.get('since');
    const action = searchParams.get('action'); // 'history' or 'verify'

    // Verify Redis connection
    if (action === 'verify') {
      const status = await verifyRedisConnection();
      return NextResponse.json({
        redis: status,
        inMemoryFallback: eventQueue.length > 0,
      });
    }

    // Get event history
    try {
      // Try Redis first
      const redisEvents = await getEventHistory(event || undefined, 100);
      
      if (redisEvents.length > 0) {
        // Filter by timestamp if specified
        if (since) {
          const sinceDate = new Date(since);
          const filtered = redisEvents.filter(
            (e) => new Date(e.timestamp || 0) >= sinceDate
          );
          return NextResponse.json({
            events: filtered,
            count: filtered.length,
            source: 'redis',
          });
        }

        return NextResponse.json({
          events: redisEvents,
          count: redisEvents.length,
          source: 'redis',
        });
      }
    } catch (error) {
      console.warn('[API Gateway] Redis history not available, using in-memory fallback');
    }

    // Fallback to in-memory queue
    const sinceDate = since ? new Date(since) : new Date(0);
    const filteredEvents = eventQueue.filter(
      (e) => (!event || e.event === event) && e.timestamp >= sinceDate
    );

    return NextResponse.json({
      events: filteredEvents,
      count: filteredEvents.length,
      source: 'memory',
    });
  } catch (error) {
    console.error('[API Gateway] Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Subscribe to an event (for modules to register handlers)
 * In production, this would use Redis pub/sub
 */
export function subscribeToEvent(
  event: string,
  handler: (data: any) => Promise<void>
) {
  if (!subscribers.has(event)) {
    subscribers.set(event, []);
  }
  subscribers.get(event)!.push(handler);
}
