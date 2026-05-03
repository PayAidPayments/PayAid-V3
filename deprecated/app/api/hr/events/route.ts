import { NextRequest } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'

/**
 * GET /api/hr/events - Server-Sent Events for real-time HR updates
 */
export async function GET(request: NextRequest) {
  const { tenantId } = await requireModuleAccess(request, 'hr')

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const send = (event: string, data: object) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }
      send('connected', { tenantId, message: 'HR events connected' })
      const interval = setInterval(() => {
        send('ping', { ts: Date.now() })
      }, 25000)
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
