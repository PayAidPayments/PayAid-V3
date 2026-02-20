/**
 * Debug route to check what's in the JWT token
 * GET /api/debug/check-auth
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, decodeToken } from '@/lib/auth/jwt'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 })
    }

    let decoded
    try {
      decoded = verifyToken(token)
    } catch (e) {
      decoded = decodeToken(token) // Try decode without verification
      return NextResponse.json({
        error: 'Token verification failed',
        decoded: decoded,
        message: e instanceof Error ? e.message : String(e),
      })
    }

    return NextResponse.json({
      success: true,
      decoded: {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        roles: decoded.roles,
        tenant_id: decoded.tenant_id,
        modules: decoded.modules,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to check auth',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
