import { NextRequest, NextResponse } from 'next/server'
import { getSessionToken } from '@/packages/auth-sdk/client'

/**
 * OAuth2 UserInfo Endpoint
 * 
 * Returns user information for the authenticated user
 */

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const token = await getSessionToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'unauthorized', error_description: 'Missing or invalid token' },
        { status: 401 }
      )
    }

    // Fetch user info from auth API
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'unauthorized', error_description: 'Invalid token' },
        { status: 401 }
      )
    }

    const data = await response.json()
    const user = data.user

    // Return OAuth2-compliant user info
    return NextResponse.json({
      sub: user.id, // Subject (user ID)
      name: user.name,
      email: user.email,
      email_verified: user.emailVerified || false,
      picture: user.avatar || user.picture,
      tenant_id: user.tenantId,
      // Additional PayAid-specific claims
      tenant: data.tenant,
      roles: user.roles || [],
    })
  } catch (error: any) {
    console.error('[OAuth] UserInfo error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: error.message },
      { status: 500 }
    )
  }
}
