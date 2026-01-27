import { NextResponse } from 'next/server'

/**
 * Health check endpoint
 * Checks database connection and environment variables
 */
export async function GET() {
  const checks = {
    database: {
      configured: !!process.env.DATABASE_URL,
      urlLength: process.env.DATABASE_URL?.length || 0,
    },
    jwt: {
      configured: !!process.env.JWT_SECRET && process.env.JWT_SECRET !== 'change-me-in-production',
      secretLength: process.env.JWT_SECRET?.length || 0,
    },
    environment: process.env.NODE_ENV || 'development',
  }

  // Try to connect to database
  let dbConnected = false
  if (checks.database.configured) {
    try {
      const { prisma } = await import('@/lib/db/prisma')
      await prisma.$queryRaw`SELECT 1`
      dbConnected = true
    } catch (error) {
      dbConnected = false
      checks.database = {
        ...checks.database,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  const isHealthy = checks.database.configured && checks.jwt.configured && dbConnected

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks: {
        ...checks,
        database: {
          ...checks.database,
          connected: dbConnected,
        },
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: isHealthy ? 200 : 503,
    }
  )
}
