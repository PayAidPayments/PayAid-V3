// CRITICAL: This file must NEVER be imported in client-side code
// Add 'server-only' marker to prevent bundling
import 'server-only'

import { PrismaClient } from '@prisma/client'
import { isDevelopment, isProduction } from '@/lib/utils/env'

// Prevent Prisma from being imported in client-side code
// Only throw error in browser runtime (not during SSR or build)
// Note: The 'server-only' import above should prevent bundling, but this is a fallback
if (typeof window !== 'undefined') {
  throw new Error(
    'Prisma Client cannot be used in client-side code. ' +
    'It should only be imported in server-side code (API routes, server components, server actions).'
  )
}

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
  // Use direct connection for migrations, pooler for queries
  // DATABASE_DIRECT_URL is used for migrations (bypasses pooler)
  // DATABASE_URL is used for queries (uses pooler)
  const databaseUrl = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL
  
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
    // Optimized for serverless (Vercel): Use minimal connections
    // With transaction mode, we can use more connections, but keep it conservative
    // For session mode, use 1-2 connections max
    // For transaction mode, use 3-5 connections
    const isTransactionMode = url.hostname.includes('pooler.supabase.com') && (url.port === '6543' || url.port === '')
    const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT 
      ? parseInt(process.env.DATABASE_CONNECTION_LIMIT, 10)
      : (isTransactionMode ? 3 : 1) // Transaction mode: 3, Session mode: 1 (very limited)
    url.searchParams.set('connection_limit', connectionLimit.toString())
  }
  
  if (!url.searchParams.has('pool_timeout')) {
    // Reduced from 20s to 5s for faster failure detection
    // With minimal data/users, connections should be available quickly
    url.searchParams.set('pool_timeout', '5') // 5 seconds - faster failure detection
  }
  
  if (!url.searchParams.has('connect_timeout')) {
    // Reduced from 10s to 3s for faster connection establishment
    // Database should respond quickly with minimal load
    url.searchParams.set('connect_timeout', '3') // 3 seconds - faster connection
  }

  // For Supabase pooler, switch to TRANSACTION mode (port 6543) to avoid connection limits
  // Session mode (port 5432) has strict limits (typically 1-5 connections per user)
  // Transaction mode allows more concurrent connections
  if (url.hostname.includes('pooler.supabase.com')) {
    // CRITICAL: Use transaction mode instead of session mode
    // Transaction mode (port 6543) allows more concurrent connections
    // Session mode (port 5432) has strict limits that cause "MaxClientsInSessionMode" errors
    // Always switch to transaction mode regardless of what port is in DATABASE_URL
    url.port = '6543' // Force transaction mode
    
    // Ensure pgbouncer is enabled for transaction mode
    if (!url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true')
    }
    
    // Log the change for debugging
    if (isDevelopment()) {
      console.log(`[PRISMA] Switched Supabase pooler to transaction mode (port 6543)`)
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

// Optimized initialization - cache client globally to reduce initialization overhead
// This is especially important for serverless cold starts
function getPrismaClient(): PrismaClient {
  // Always cache in global to avoid re-initialization overhead
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }
  
  try {
    const client = createPrismaClient()
    // Cache in global for both dev and production (Vercel handles cleanup)
    // This reduces initialization overhead on each request
    globalForPrisma.prisma = client
    
    // Pre-connect to database to reduce first-query latency
    // This is especially important for serverless cold starts
    // Don't await - let it connect in background
    client.$connect().catch((error) => {
      // Silently handle connection errors - Prisma will retry on first query
      // This is non-blocking and won't affect performance
      if (isDevelopment()) {
        console.warn('[PRISMA] Pre-connection failed (will retry on first query):', error?.message)
      }
    })
    
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

