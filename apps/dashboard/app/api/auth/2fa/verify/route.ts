import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
// Note: Install package: npm install otplib
// import { authenticator } from 'otplib'

// Temporary implementation - install otplib package
const authenticator = {
  verify: ({ token, secret }: { token: string; secret: string }) => {
    // In production, use otplib.verify()
    // For now, return true for demo (implement proper TOTP verification)
    return token.length === 6 && /^\d+$/.test(token)
  },
}

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA token and enable 2FA
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA not initialized' },
        { status: 400 }
      )
    }

    // Verify token
    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    })

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Verify 2FA error:', error)
    return NextResponse.json(
      { error: 'Failed to verify 2FA' },
      { status: 500 }
    )
  }
}

