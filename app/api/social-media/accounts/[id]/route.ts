import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'

/**
 * DELETE /api/social-media/accounts/[id] - Disconnect a social media account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const { id } = await params

    // Verify account belongs to tenant
    const account = await prisma.socialMediaAccount.findUnique({
      where: { id },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    if (account.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Disconnect account (set isConnected to false, clear tokens)
    await prisma.socialMediaAccount.update({
      where: { id },
      data: {
        isConnected: false,
        accessToken: undefined,
        refreshToken: undefined,
        expiresAt: undefined,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Disconnect social media account error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    )
  }
}

