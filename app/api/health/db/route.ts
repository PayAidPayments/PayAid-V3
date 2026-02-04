import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/health/db
 * Database health check endpoint
 * Returns database connection status and configuration info
 */
export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is set
    const hasDatabaseUrl = !!process.env.DATABASE_URL
    const hasDirectUrl = !!process.env.DATABASE_DIRECT_URL
    
    // Try to connect to database
    let connectionStatus = 'unknown'
    let connectionError: string | null = null
    let databaseInfo: any = null
    
    try {
      // Simple query to test connection
      const result = await prisma.$queryRaw`SELECT 1 as test`
      connectionStatus = 'connected'
      
      // Get database version
      try {
        const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`
          SELECT version()
        `
        databaseInfo = {
          version: versionResult[0]?.version || 'unknown',
        }
      } catch {
        // Ignore version query errors
      }
    } catch (error: any) {
      connectionStatus = 'failed'
      connectionError = error?.message || String(error)
      
      // Parse error for more details
      if (error?.code) {
        connectionError = `${error.code}: ${connectionError}`
      }
    }
    
    // Extract database host from DATABASE_URL (without exposing password)
    let databaseHost = 'not configured'
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL)
        databaseHost = url.hostname
      } catch {
        databaseHost = 'invalid URL format'
      }
    }
    
    return NextResponse.json({
      status: connectionStatus === 'connected' ? 'healthy' : 'unhealthy',
      connection: {
        status: connectionStatus,
        error: connectionError,
        host: databaseHost,
        hasDatabaseUrl,
        hasDirectUrl,
      },
      database: databaseInfo,
      troubleshooting: connectionStatus === 'failed' ? {
        steps: [
          '1. Check if DATABASE_URL is set in Vercel environment variables',
          '2. Verify the database connection string is correct',
          '3. If using Supabase, check if your project is paused: https://supabase.com/dashboard',
          '4. Resume the Supabase project if it\'s paused (free tier pauses after inactivity)',
          '5. Wait 1-2 minutes after resuming for the database to activate',
          '6. Verify the database password is correct',
          '7. Try using direct connection URL instead of pooler URL',
        ],
        supabaseCheck: 'Go to https://supabase.com/dashboard and check if your project status is "Active"',
      } : null,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error?.message || 'Unknown error',
        connection: {
          status: 'error',
          hasDatabaseUrl: !!process.env.DATABASE_URL,
        },
      },
      { status: 500 }
    )
  }
}
