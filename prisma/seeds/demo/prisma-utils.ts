import type { PrismaClient } from '@prisma/client'

type RetryableError = {
  code?: string
  message?: string
}

function isRetryablePrismaError(err: unknown) {
  const e = err as RetryableError | null
  const code = e?.code
  if (!code) return false
  // P1001: Can't reach database server
  // P1002: The database server was reached but timed out
  // P1003: Database does not exist (sometimes transient in poolers during failover)
  // P2034: Transaction failed due to a write conflict or a deadlock
  return code === 'P1001' || code === 'P1002' || code === 'P1003' || code === 'P2034'
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { label?: string; retries?: number; baseDelayMs?: number }
): Promise<T> {
  const label = opts?.label ?? 'prisma-op'
  const retries = opts?.retries ?? 6
  const baseDelayMs = opts?.baseDelayMs ?? 250

  let attempt = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn()
    } catch (err) {
      attempt += 1
      if (!isRetryablePrismaError(err) || attempt > retries) {
        throw err
      }

      const delay = Math.round(baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100)
      console.log(`  ⚠ ${label} failed (attempt ${attempt}/${retries}). Retrying in ${delay}ms...`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
}

export function requirePrismaClient(prismaClient?: PrismaClient): PrismaClient {
  if (!prismaClient) {
    throw new Error('PrismaClient must be provided to this seeder to avoid connection pool exhaustion')
  }
  return prismaClient
}

