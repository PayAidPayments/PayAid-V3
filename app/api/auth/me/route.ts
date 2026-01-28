import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, JWTPayload } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'

export async function GET(request: NextRequest) {
  try {
    // Fast JWT verification without database query
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let payload: JWTPayload
    
    try {
      payload = verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!payload.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Fetch user with tenant - using retry logic with faster settings
    const userData = await prismaWithRetry(() =>
      prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          createdAt: true,
          lastLoginAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
              plan: true,
              status: true,
              licensedModules: true,
              subscriptionTier: true,
              maxContacts: true,
              maxInvoices: true,
              maxUsers: true,
              maxStorage: true,
              industry: true,
              industrySubType: true,
              industrySettings: true,
              onboardingCompleted: true,
              subscription: {
                select: {
                  id: true,
                  trialEndsAt: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      {
        maxRetries: 2, // Reduce retries
        retryDelay: 300, // Faster retries
        exponentialBackoff: false, // Disable exponential backoff
      }
    )

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // IMPORTANT: Always use tenant data from database, not from token
    // The token's tenantId is used for lookup, but tenant data comes from DB
    // This ensures consistency even if token has stale data
    
    // Verify tenantId from token matches database tenant
    if (payload.tenantId && userData.tenant?.id && payload.tenantId !== userData.tenant.id) {
      console.warn(`Tenant ID mismatch: Token has ${payload.tenantId}, DB has ${userData.tenant.id}`)
      // Return database tenant (source of truth)
    }

    // Use licensed modules from database (source of truth), not token
    // Token is just for quick lookup, but DB is authoritative
    if (userData.tenant) {
      userData.tenant = {
        ...userData.tenant,
        licensedModules: userData.tenant.licensedModules || [],
        subscriptionTier: userData.tenant.subscriptionTier || 'free',
      }
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Get user error:', error)
    
    // Handle pool exhaustion gracefully
    const errorMessage = error instanceof Error ? error.message : 'Failed to get user'
    const isPoolExhausted = errorMessage.includes('MaxClientsInSessionMode') || 
                            errorMessage.includes('max clients reached')
    
    if (isPoolExhausted) {
      // Pool exhausted - return 503 with retry suggestion
      return NextResponse.json(
        { 
          error: 'Database temporarily unavailable',
          message: 'Please try again in a moment',
        },
        { status: 503 }
      )
    }
    
    // Return a more specific error message
    const statusCode = errorMessage.includes('timeout') ? 504 : 500
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

