/**
 * Prisma Read Replica Client
 * 
 * For 10,000+ users, separate read/write operations:
 * - Use read replica for GET requests (queries)
 * - Use primary for POST/PATCH/DELETE requests (writes)
 * 
 * This distributes read load across multiple database instances,
 * reducing primary database load by 70-80%.
 */

import { PrismaClient } from '@prisma/client'
import { isDevelopment, isProduction } from '@/lib/utils/env'

// Prevent Prisma from being imported in client-side code
// Note: We can't use 'server-only' here because some files that import Prisma
// are also imported by client components indirectly. The runtime check is sufficient.
if (typeof window !== 'undefined') {
  throw new Error(
    'Prisma Client cannot be used in client-side code. ' +
    'It should only be imported in server-side code (API routes, server components, server actions).'
  )
}

const globalForPrismaRead = globalThis as unknown as {
  prismaRead: PrismaClient | undefined
}

/**
 * Create Prisma Client for read replica
 * Falls back to primary database if read replica URL is not configured
 */
function createPrismaReadClient(): PrismaClient {
  // Use read replica URL if available, otherwise fall back to primary
  const databaseUrl = process.env.DATABASE_READ_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  DATABASE_READ_URL not set, using primary database for reads')
    }
    throw new Error('DATABASE_URL environment variable is not set.')
  }

  // Parse and enhance DATABASE_URL with connection pool parameters
  const url = new URL(databaseUrl)

  // Add connection pool parameters for read replica
  // Read replicas typically handle more connections (read-only)
  if (!url.searchParams.has('connection_limit')) {
    const connectionLimit = process.env.DATABASE_READ_CONNECTION_LIMIT
      ? parseInt(process.env.DATABASE_READ_CONNECTION_LIMIT, 10)
      : (isProduction() ? 20 : 10) // More connections for read replica
    url.searchParams.set('connection_limit', connectionLimit.toString())
  }

  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', '20')
  }

  if (!url.searchParams.has('connect_timeout')) {
    url.searchParams.set('connect_timeout', '10')
  }

  // For Supabase pooler
  if (url.hostname.includes('pooler.supabase.com')) {
    if (!url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true')
    }
  }

  const enhancedDatabaseUrl = url.toString()

  return new PrismaClient({
    // Read replicas are typically used for queries, so we can log more in dev
    log: isDevelopment()
      ? (process.env.PRISMA_LOG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'])
      : ['error'],
    datasources: {
      db: {
        url: enhancedDatabaseUrl,
      },
    },
  })
}

/**
 * Get Prisma read client (singleton)
 */
function getPrismaReadClient(): PrismaClient {
  if (globalForPrismaRead.prismaRead) {
    return globalForPrismaRead.prismaRead
  }

  try {
    const client = createPrismaReadClient()
    // Cache in development to avoid multiple connections
    if (!isProduction()) {
      globalForPrismaRead.prismaRead = client
    }
    return client
  } catch (error) {
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error(
        'DATABASE_URL or DATABASE_READ_URL environment variable is not set.\n\n' +
        '🔧 For read replicas, set DATABASE_READ_URL to your read replica connection string.\n' +
        'If not using read replicas, DATABASE_READ_URL will fall back to DATABASE_URL.'
      )
    }
    throw error
  }
}

// Export singleton Prisma read client
// Use Proxy to defer initialization until first access
export const prismaRead = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaReadClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
  set(_target, prop, value) {
    const client = getPrismaReadClient()
    ;(client as any)[prop] = value
    return true
  },
  has(_target, prop) {
    try {
      const client = getPrismaReadClient()
      return prop in client
    } catch {
      return false
    }
  },
  ownKeys(_target) {
    try {
      const client = getPrismaReadClient()
      return Reflect.ownKeys(client)
    } catch {
      return []
    }
  }
})

// Graceful shutdown
if (!isProduction() || typeof process !== 'undefined') {
  const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME

  if (!isServerless && process.env.DATABASE_READ_URL) {
    process.on('beforeExit', async () => {
      try {
        if (globalForPrismaRead.prismaRead) {
          await globalForPrismaRead.prismaRead.$disconnect()
        }
      } catch (error) {
        // Ignore errors during shutdown
      }
    })
  }
}

export default prismaRead
