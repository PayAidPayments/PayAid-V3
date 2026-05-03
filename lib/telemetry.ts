/**
 * Phase 10: Observability – OpenTelemetry-compatible spans for Prisma, Redis, API.
 * Optional: npm i @opentelemetry/api @vercel/otel. When not installed, no-op.
 * Use with Vercel Speed Insights (P95 TTFB) and Sentry for frontend errors.
 */

export type SpanContext = { end: () => void; setAttribute: (k: string, v: string | number | boolean) => void }

let tracer: { startActiveSpan: (name: string, opts: unknown, fn: (span: SpanContext) => Promise<unknown>) => Promise<unknown> } | null = null

try {
  const api = require('@opentelemetry/api')
  tracer = api.trace.getTracer('payaid-v3', process.env.npm_package_version || '1.0.0')
} catch {
  tracer = null
}

function noopSpan(): SpanContext {
  return { end: () => {}, setAttribute: () => {} }
}

/**
 * Run fn with an optional active span (Prisma, Redis, API). No-op when OTEL not installed.
 */
export async function startSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean> | undefined,
  fn: (span: SpanContext) => Promise<T>
): Promise<T> {
  if (!tracer) return fn(noopSpan())
  return tracer.startActiveSpan(
    name,
    { attributes: attributes || {} },
    async (span: SpanContext) => {
      try {
        return await fn(span)
      } finally {
        span.end()
      }
    }
  ) as Promise<T>
}

/**
 * Wrap a Prisma query in a span (call from route or service).
 */
export async function withPrismaSpan<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  return startSpan(`prisma.${operation}`, { 'db.system': 'postgresql' }, async (span) => {
    const result = await fn()
    return result
  })
}

/**
 * Wrap Redis in a span.
 */
export async function withRedisSpan<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  return startSpan(`redis.${operation}`, { 'db.system': 'redis' }, async () => fn())
}

/**
 * Wrap API handler in a span.
 */
export async function withAPISpan<T>(route: string, fn: () => Promise<T>): Promise<T> {
  return startSpan(`api.${route}`, { 'http.route': route }, async () => fn())
}

export const telemetry = { startSpan, withPrismaSpan, withRedisSpan, withAPISpan }
