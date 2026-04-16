import { NextResponse } from 'next/server'

const overloadStats = new Map<string, { count: number; firstAt: number }>()

function messageFromUnknown(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return ''
  }
}

export function isTransientDbOverloadError(error: unknown): boolean {
  const msg = messageFromUnknown(error).toLowerCase()
  return (
    msg.includes('timed out fetching a new connection') ||
    msg.includes('connection pool') ||
    msg.includes("can't reach database server") ||
    msg.includes('connectionreset') ||
    msg.includes('forcibly closed') ||
    msg.includes('econnreset')
  )
}

export function dbOverloadResponse(entityLabel: string): NextResponse {
  const key = entityLabel.toLowerCase()
  const now = Date.now()
  const existing = overloadStats.get(key)
  if (!existing) {
    overloadStats.set(key, { count: 1, firstAt: now })
  } else {
    existing.count += 1
    // Log at low frequency (first + every 10th) to avoid noisy output.
    if (existing.count === 1 || existing.count % 10 === 0) {
      const elapsedSec = Math.max(1, Math.floor((now - existing.firstAt) / 1000))
      console.warn(
        `[DB_OVERLOAD] ${entityLabel} overload responses=${existing.count} window=${elapsedSec}s`
      )
    }
  }

  return NextResponse.json(
    {
      error: `${entityLabel} service is temporarily busy`,
      message: `We are experiencing high database load while processing ${entityLabel.toLowerCase()}. Please retry in 10-20 seconds.`,
      retryAfterSeconds: 15,
    },
    {
      status: 503,
      headers: {
        'Retry-After': '15',
      },
    }
  )
}
