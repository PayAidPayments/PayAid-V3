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
    throw new Error('DATABASE_URL environment variable is not set')
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
    // Additional Prisma configuration for production stability
    ...(isProduction() && {
      // Disable query engine auto-install in production
      __internal: {
        engine: {
          connectTimeout: 10000, // 10 seconds
        },
      },
    }),
  })
}

// Create singleton Prisma client
// In development, reuse the same instance to avoid connection exhaustion
// In production (serverless), create new instance per request (Vercel handles this)
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// In development, cache the Prisma client to avoid creating multiple connections
if (!isProduction()) {
  globalForPrisma.prisma = prisma
}

// Connection health check and auto-reconnection
// This ensures connections are validated and reconnected if needed
if (isProduction()) {
  // Set up connection health monitoring
  let isHealthy = true
  let lastHealthCheck = Date.now()
  const HEALTH_CHECK_INTERVAL = 60000 // Check every minute

  // Periodic health check
  setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
      isHealthy = true
      lastHealthCheck = Date.now()
    } catch (error) {
      console.error('Database health check failed:', error)
      isHealthy = false
      
      // Attempt to reconnect
      try {
        await prisma.$disconnect()
        // Prisma will automatically reconnect on next query
        isHealthy = true
      } catch (reconnectError) {
        console.error('Failed to reconnect to database:', reconnectError)
      }
    }
  }, HEALTH_CHECK_INTERVAL)

  // Graceful shutdown
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

export default prisma

