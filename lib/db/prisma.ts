import { PrismaClient } from '@prisma/client'
import { isDevelopment, isProduction } from '@/lib/utils/env'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Enhanced Prisma Client with production-ready connection pooling
 * 
 * Connection Pool Configuration:
 * - connection_limit: Maximum number of connections in the pool (10 for serverless, 20+ for long-running)
 * - pool_timeout: Maximum time to wait for a connection (20 seconds)
 * - connect_timeout: Time to wait when establishing connection (10 seconds)
 * 
 * For Supabase:
 * - Use Session pooler (port 5432) for better compatibility
 * - Add ?pgbouncer=true for transaction mode pooler
 * - Connection limit should match Supabase pooler limits
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    // In development, provide a helpful error message
    if (process.env.NODE_ENV === 'development') {
      console.error('⚠️  DATABASE_URL environment variable is not set')
      console.error('Please set DATABASE_URL in your .env file')
    }
    // In production, throw error but with better message
    throw new Error('DATABASE_URL environment variable is not set. Please configure it in your environment variables.')
  }

  // Parse and enhance DATABASE_URL with connection pool parameters
  const url = new URL(databaseUrl)
  
  // Add connection pool parameters if not already present
  // These parameters are passed to the underlying PostgreSQL driver
  if (!url.searchParams.has('connection_limit')) {
    // For serverless (Vercel), use smaller pool (10 connections)
    // For long-running processes, use larger pool (20+ connections)
    const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT 
      ? parseInt(process.env.DATABASE_CONNECTION_LIMIT, 10)
      : (isProduction() ? 10 : 20)
    url.searchParams.set('connection_limit', connectionLimit.toString())
  }
  
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', '20') // 20 seconds
  }
  
  if (!url.searchParams.has('connect_timeout')) {
    url.searchParams.set('connect_timeout', '10') // 10 seconds
  }

  // For Supabase pooler, ensure proper configuration
  if (url.hostname.includes('pooler.supabase.com')) {
    // Supabase pooler works best with these settings
    if (!url.searchParams.has('pgbouncer')) {
      // Use transaction mode for better compatibility
      url.searchParams.set('pgbouncer', 'true')
    }
  }

  const enhancedDatabaseUrl = url.toString()

  return new PrismaClient({
    // Only log errors in production, disable query logging for performance
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

// Lazy initialization function - only create Prisma client when actually needed
// This prevents errors during module import if DATABASE_URL is not set
function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }
  
  try {
    const client = createPrismaClient()
    // In development, cache the Prisma client to avoid creating multiple connections
    if (!isProduction()) {
      globalForPrisma.prisma = client
    }
    return client
  } catch (error) {
    // If DATABASE_URL is not set, provide a more helpful error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error(
        'DATABASE_URL environment variable is not set. Please configure it in your environment variables.\n\n' +
        '🔧 Troubleshooting Steps:\n' +
        '1. Check if DATABASE_URL is set in Vercel environment variables\n' +
        '2. Verify the database connection string is correct\n' +
        '3. If using Supabase, check if your project is paused\n' +
        '4. Ensure environment variables are set for Production environment'
      )
    }
    throw error
  }
}

// Create singleton Prisma client with lazy initialization
// In development, reuse the same instance to avoid connection exhaustion
// In production (serverless), create new instance per request (Vercel handles this)
// Using Proxy to defer initialization until first access
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = (client as any)[prop]
    // If it's a function, bind it to the client to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(client)
    }
    // For model properties (like prisma.contact), return them as-is
    // They are already bound to the client instance
    return value
  },
  set(_target, prop, value) {
    const client = getPrismaClient()
    ;(client as any)[prop] = value
    return true
  },
  has(_target, prop) {
    try {
      const client = getPrismaClient()
      return prop in client
    } catch {
      return false
    }
  },
  ownKeys(_target) {
    try {
      const client = getPrismaClient()
      return Reflect.ownKeys(client)
    } catch {
      return []
    }
  }
})

// Connection health check and auto-reconnection
// Note: In serverless (Vercel), each function invocation is a new instance
// Health checks are handled per-request, not via intervals
// Graceful shutdown for long-running processes
if (!isProduction() || typeof process !== 'undefined') {
  // Only set up interval health checks in non-serverless environments
  // In serverless, connections are created per-request and don't need health checks
  const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME
  
  if (!isServerless && process.env.DATABASE_URL) {
    // Set up connection health monitoring for long-running processes
    // Only if DATABASE_URL is set to avoid errors during initialization
    let isHealthy = true
    let lastHealthCheck = Date.now()
    const HEALTH_CHECK_INTERVAL = 60000 // Check every minute

    // Periodic health check
    setInterval(async () => {
      try {
        // Only check if we have a valid client
        if (globalForPrisma.prisma) {
          await globalForPrisma.prisma.$queryRaw`SELECT 1`
          isHealthy = true
          lastHealthCheck = Date.now()
        }
      } catch (error) {
        console.error('Database health check failed:', error)
        isHealthy = false
        
        // Attempt to reconnect
        try {
          if (globalForPrisma.prisma) {
            await globalForPrisma.prisma.$disconnect()
            // Prisma will automatically reconnect on next query
            isHealthy = true
          }
        } catch (reconnectError) {
          console.error('Failed to reconnect to database:', reconnectError)
        }
      }
    }, HEALTH_CHECK_INTERVAL)
  }

  // Graceful shutdown
  process.on('beforeExit', async () => {
    try {
      if (globalForPrisma.prisma) {
        await globalForPrisma.prisma.$disconnect()
      }
    } catch (error) {
      // Ignore errors during shutdown
    }
  })
}

export default prisma

