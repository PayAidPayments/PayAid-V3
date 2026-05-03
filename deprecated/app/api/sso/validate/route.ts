import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { generateSSOToken } from '@/lib/sso/token-manager'

// POST /api/sso/validate - Validate SSO token from query parameter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      )
    }

    // Verify JWT token
    const payload = verifyToken(token)
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Generate SSO token
    const ssoToken = generateSSOToken(payload)

    return NextResponse.json({
      success: true,
      ssoToken,
      user: {
        id: payload.userId,
        email: payload.email,
        tenantId: payload.tenantId,
      },
    })
  } catch (error: any) {
    console.error('SSO validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate SSO token' },
      { status: 500 }
    )
  }
}

// GET /api/sso/validate - Validate SSO token from query parameter (for redirects)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('sso_token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      )
    }

    // Verify JWT token
    const payload = verifyToken(token)
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Generate SSO token
    const ssoToken = generateSSOToken(payload)

    return NextResponse.json({
      success: true,
      ssoToken,
      user: {
        id: payload.userId,
        email: payload.email,
        tenantId: payload.tenantId,
      },
    })
  } catch (error: any) {
    console.error('SSO validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate SSO token' },
      { status: 500 }
    )
  }
}

