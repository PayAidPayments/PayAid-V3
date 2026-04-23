import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const searchParams = request.nextUrl.searchParams

    const accountId = searchParams.get('accountId') || undefined
    const folderId = searchParams.get('folderId') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    const where: any = {
      account: {
        tenantId,
      },
    }

    if (accountId) where.accountId = accountId
    if (folderId) where.folderId = folderId

    const [messages, total] = await Promise.all([
      prisma.emailMessage.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          accountId: true,
          folderId: true,
          subject: true,
          fromEmail: true,
          fromName: true,
          toEmails: true,
          isRead: true,
          threadId: true,
          sentAt: true,
          receivedAt: true,
        },
      }),
      prisma.emailMessage.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        messages,
        total,
        page,
        pageSize,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('List email messages failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to list email messages' }, { status: 500 })
  }
}
