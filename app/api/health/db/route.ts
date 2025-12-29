import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/health/db - Check database connection health
export async function GET(request: NextRequest) {
  try {
    const hasDatabaseUrl = !!process.env.DATABASE_URL
    const databaseUrlPreview = process.env.DATABASE_URL
      ? `${process.env.DATABASE_URL.substring(0, 30)}...`
      : 'NOT SET'

    if (!hasDatabaseUrl) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'DATABASE_URL is not configured',
          hasDatabaseUrl: false,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    // Test database connection with a simple query
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1 as test`
    const queryTime = Date.now() - startTime

    // Try to check if User table exists
    let userTableExists = false
    try {
      const userCount = await prisma.user.count()
      userTableExists = true
    } catch (error) {
      console.error('[HEALTH] User table check failed:', error)
    }

    return NextResponse.json({
      status: 'healthy',
      hasDatabaseUrl: true,
      databaseUrlPreview,
      queryTimeMs: queryTime,
      userTableExists,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = (error as any)?.code
    const errorMeta = (error as any)?.meta

    console.error('[HEALTH] ❌ Database health check failed:', {
      error: errorMessage,
      code: errorCode,
      meta: errorMeta,
    })

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: errorMessage,
        code: errorCode,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL
          ? `${process.env.DATABASE_URL.substring(0, 30)}...`
          : 'NOT SET',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

