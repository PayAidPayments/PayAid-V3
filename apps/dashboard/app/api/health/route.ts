import { NextResponse } from 'next/server'

/**
 * Health check endpoint
 * Checks database connection and environment variables
 */
export async function GET() {
  const checks: {
    database: {
      configured: boolean
      urlLength: number
      error?: string
    }
    jwt: { configured: boolean; secretLength: number }
    environment: string
  } = {
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

  const dbUrl = process.env.DATABASE_URL || ''
  const hints: string[] = []
  if (!dbConnected && dbUrl.includes('pooler.supabase.com')) {
    if (dbUrl.includes(':5432')) {
      hints.push('On Vercel, use Supabase transaction pooler port 6543 with ?pgbouncer=true&sslmode=require')
    }
    if (checks.database.error?.includes("Can't reach database")) {
      hints.push('Check if Supabase project is paused or DATABASE_URL host is reachable')
    }
  }
  if (!checks.database.configured) {
    hints.push('Set DATABASE_URL in Vercel → Project → Settings → Environment Variables')
  }

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks: {
        ...checks,
        database: {
          ...checks.database,
          connected: dbConnected,
          poolerMode: dbUrl.includes(':6543') ? 'transaction' : dbUrl.includes(':5432') ? 'session' : 'unknown',
        },
      },
      hints: hints.length > 0 ? hints : undefined,
      timestamp: new Date().toISOString(),
    },
    {
      status: isHealthy ? 200 : 503,
    }
  )
}
