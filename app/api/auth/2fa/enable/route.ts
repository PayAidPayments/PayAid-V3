import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
// Note: Install packages: npm install otplib qrcode
// import { authenticator } from 'otplib'
// import QRCode from 'qrcode'

// Temporary implementation - install otplib and qrcode packages
const authenticator = {
  generateSecret: () => {
    // Generate a random secret (in production, use otplib)
    return Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  },
  keyuri: (accountName: string, serviceName: string, secret: string) => {
    return `otpauth://totp/${encodeURIComponent(serviceName)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(serviceName)}`
  },
}

const QRCode = {
  toDataURL: async (url: string) => {
    // In production, use qrcode package
    // For now, return a placeholder
    return `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"><text>${url}</text></svg>`).toString('base64')}`
  },
}

/**
 * POST /api/auth/2fa/enable
 * Enable 2FA for user
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate secret
    const secret = authenticator.generateSecret()
    const serviceName = 'PayAid V3'
    const accountName = user.email || user.name || 'User'

    // Generate QR code URL
    const otpAuthUrl = authenticator.keyuri(accountName, serviceName, secret)

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl)

    // Store secret temporarily (user needs to verify before enabling)
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: false, // Will be enabled after verification
      },
    })

    return NextResponse.json({
      secret,
      qrCodeUrl,
      otpAuthUrl,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Enable 2FA error:', error)
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    )
  }
}

