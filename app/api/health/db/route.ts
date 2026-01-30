import { NextResponse } from 'next/server'
import { circuitBreaker } from '@/lib/db/circuit-breaker'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/health/db
 * Check database health and circuit breaker state
 */
export async function GET() {
  try {
    const circuitState = circuitBreaker.getState()
    
    // Try a simple database query to check connectivity
    let dbHealthy = false
    let dbError: string | null = null
    
    try {
      await prisma.$queryRaw`SELECT 1`
      dbHealthy = true
    } catch (error: any) {
      dbHealthy = false
      dbError = error?.message || 'Database connection failed'
    }
    
    return NextResponse.json({
      database: {
        healthy: dbHealthy,
        error: dbError,
      },
      circuitBreaker: {
        state: circuitState.state,
        failures: circuitState.failures,
        lastFailureTime: circuitState.lastFailureTime,
        isOpen: circuitBreaker.isOpen(),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Health check failed',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
