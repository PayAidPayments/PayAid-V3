import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

type RouteContext = {
  params: Promise<{ accountId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { accountId } = await context.params

    const account = await prisma.emailAccount.findFirst({
      where: { id: accountId, tenantId },
      select: {
        id: true,
        email: true,
        displayName: true,
        provider: true,
        providerAccountId: true,
        imapHost: true,
        imapPort: true,
        smtpHost: true,
        smtpPort: true,
        isActive: true,
        isLocked: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!account) {
      return NextResponse.json({ success: false, error: 'Email account not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: account })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get email account failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch email account' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { accountId } = await context.params

    const existing = await prisma.emailAccount.findFirst({
      where: { id: accountId, tenantId },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Email account not found' }, { status: 404 })
    }

    await prisma.emailAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete email account failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete email account' }, { status: 500 })
  }
}
