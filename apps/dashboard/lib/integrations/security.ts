import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
}

type ErrorCaptureOptions = {
  scope: string
  tenantId?: string | null
  userId?: string | null
  error: unknown
  context?: Record<string, unknown>
}

const bucketStore = new Map<string, { count: number; resetAt: number }>()

const SENSITIVE_KEY_PATTERN = /(password|secret|token|authorization|api[_-]?key|credential)/i

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = request.headers.get('x-real-ip')?.trim()
  return forwarded || realIp || 'unknown'
}

export function redactSensitive<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item)) as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : redactSensitive(child)
    }
    return out as T
  }
  if (typeof value === 'string' && value.length > 2048) {
    return `${value.slice(0, 2048)}...[truncated]` as T
  }
  return value
}

export function enforceIntegrationRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): NextResponse | null {
  const now = Date.now()
  const clientIp = getClientIp(request)
  const routeKey = `${options.key}:${clientIp}`
  const bucket = bucketStore.get(routeKey)

  if (!bucket || bucket.resetAt <= now) {
    bucketStore.set(routeKey, { count: 1, resetAt: now + options.windowMs })
    return null
  }

  if (bucket.count >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    return NextResponse.json(
      {
        error: 'Too many requests. Please retry later.',
        code: 'RATE_LIMITED',
        retry_after_seconds: retryAfterSeconds,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      }
    )
  }

  bucket.count += 1
  bucketStore.set(routeKey, bucket)
  return null
}

export async function captureIntegrationError(options: ErrorCaptureOptions): Promise<void> {
  const message =
    options.error instanceof Error ? options.error.message : typeof options.error === 'string' ? options.error : 'Unknown integration error'

  const safeContext = redactSensitive({
    ...(options.context || {}),
    scope: options.scope,
    message,
  })

  console.error(`[integration-error] ${options.scope}`, safeContext)

  if (!options.tenantId) return

  await prisma.auditLog
    .create({
      data: {
        tenantId: options.tenantId,
        entityType: 'integration_error',
        entityId: options.scope,
        changedBy: options.userId || 'system',
        changeSummary: `integration_error:${options.scope}`,
        afterSnapshot: safeContext as any,
      },
    })
    .catch(() => undefined)
}

