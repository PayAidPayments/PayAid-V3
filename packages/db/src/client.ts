/**
 * @payaid/db – Prisma client singleton (server-only).
 * Phase 2: Shared DB package for Turborepo apps.
 */

import 'server-only'
import { PrismaClient } from '@prisma/client'

const isDev = () => (process.env.NODE_ENV || 'development').toLowerCase() === 'development'
const isProd = () => (process.env.NODE_ENV || 'development').toLowerCase() === 'production'

if (typeof window !== 'undefined') {
  throw new Error('Prisma Client cannot be used in client-side code. Use server-only imports.')
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL
  if (!databaseUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.error('⚠️  DATABASE_URL environment variable is not set')
    }
    throw new Error('DATABASE_URL environment variable is not set.')
  }

  const url = new URL(databaseUrl)
  if (!url.searchParams.has('connection_limit')) {
    const isTransactionMode = url.hostname.includes('pooler.supabase.com') && (url.port === '6543' || url.port === '')
    const isLocalhost = isDev() && !process.env.VERCEL
    const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT
      ? parseInt(process.env.DATABASE_CONNECTION_LIMIT, 10)
      : isTransactionMode ? (isLocalhost ? 10 : 3) : 1
    url.searchParams.set('connection_limit', connectionLimit.toString())
  }
  if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '5')
  if (!url.searchParams.has('connect_timeout')) {
    const isSupabasePooler = url.hostname.includes('pooler.supabase.com')
    url.searchParams.set('connect_timeout', isSupabasePooler ? '15' : '3')
  }
  if (url.hostname.includes('pooler.supabase.com')) {
    if (!url.searchParams.has('pgbouncer')) url.searchParams.set('pgbouncer', 'true')
    if (!url.searchParams.has('sslmode')) url.searchParams.set('sslmode', 'require')
  }

  return new PrismaClient({
    log: isDev() ? (process.env.PRISMA_LOG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn']) : ['error'],
    datasources: { db: { url: url.toString() } },
  })
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  const client = createPrismaClient()
  globalForPrisma.prisma = client
  client.$connect().catch((err: unknown) => {
    if (isDev()) console.warn('[PRISMA] Pre-connect failed:', (err as Error)?.message)
  })
  return client
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') return value.bind(client)
    return value
  },
  set(_, prop, value) {
    const client = getPrismaClient()
    ;(client as unknown as Record<string | symbol, unknown>)[prop] = value
    return true
  },
  has(_, prop) {
    return prop in getPrismaClient()
  },
  ownKeys(_) {
    return Reflect.ownKeys(getPrismaClient())
  },
})

export default prisma
