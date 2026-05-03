import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { addEmailSyncJob } from '@/lib/queue/email-queue'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

type RouteContext = {
  params: Promise<{ accountId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { accountId } = await context.params

    const account = await prisma.emailAccount.findFirst({
      where: { id: accountId, tenantId, isActive: true },
      select: { id: true, provider: true },
    })

    if (!account) {
      return NextResponse.json({ success: false, error: 'Email account not found' }, { status: 404 })
    }

    await addEmailSyncJob(
      {
        accountId: account.id,
        tenantId,
        maxResults: 50,
      },
      {
        priority: 2,
      }
    )

    return NextResponse.json({
      success: true,
      data: {
        accountId: account.id,
        provider: account.provider,
        queued: true,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Queue email sync failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to queue email sync' }, { status: 500 })
  }
}
