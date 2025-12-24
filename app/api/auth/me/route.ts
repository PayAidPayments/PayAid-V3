import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, JWTPayload } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

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

    // Fetch user with tenant - optimized with timeout
    const userData = await Promise.race([
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
            },
          },
        },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 2000) // Reduced to 2 seconds
      ),
    ]) as any

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
    
    // Return a more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to get user'
    const statusCode = errorMessage.includes('timeout') ? 504 : 500
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

