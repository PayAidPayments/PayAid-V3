/**
 * In-memory fallback for POST /api/events when Redis is unavailable.
 * Not a Next.js route — keeps subscribe helpers out of app/api (Next only allows HTTP exports there).
 */

export type GatewayQueuedEvent = {
  event: string
  data: unknown
  timestamp: Date
  module: string
}

const eventQueue: GatewayQueuedEvent[] = []

const subscribers = new Map<string, Array<(data: unknown) => Promise<void>>>()

export function subscribeToEvent(
  event: string,
  handler: (data: unknown) => Promise<void>
) {
  if (!subscribers.has(event)) {
    subscribers.set(event, [])
  }
  subscribers.get(event)!.push(handler)
}

export function notifyInMemorySubscribers(event: string, data: unknown) {
  const eventSubscribers = subscribers.get(event) || []
  for (const subscriber of eventSubscribers) {
    void subscriber(data).catch((error) => {
      console.error(`[API Gateway] Error in subscriber for ${event}:`, error)
    })
  }
}

export function pushToMemoryQueue(entry: GatewayQueuedEvent) {
  eventQueue.push(entry)
}

export function getMemoryEventQueue(): readonly GatewayQueuedEvent[] {
  return eventQueue
}

export async function handleGatewayEvent(event: string, data: unknown) {
  switch (event) {
    case 'order.created':
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/finance/invoices/auto-create`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Service-Key': process.env.API_GATEWAY_KEY || 'internal-service-key',
            },
            body: JSON.stringify({
              order_id: (data as { id?: string })?.id,
              customer_id: (data as { customer_id?: string })?.customer_id,
              amount: (data as { total?: number })?.total,
              order_data: data,
            }),
          }
        )
      } catch (error) {
        console.error('[API Gateway] Error creating invoice from order:', error)
      }
      break

    case 'contact.created':
      console.log('[API Gateway] Contact created, notifying Sales module')
      break

    case 'deal.won':
      console.log('[API Gateway] Deal won, notifying Finance and Sales modules')
      break

    case 'invoice.created':
      console.log('[API Gateway] Invoice created, notifying CRM module')
      break

    case 'payment.received':
      console.log('[API Gateway] Payment received, notifying CRM and Finance modules')
      break

    default:
      console.log(`[API Gateway] Unhandled event: ${event}`)
  }
}
