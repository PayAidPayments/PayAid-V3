import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

type RouteContext = {
  params: Promise<{ messageId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { messageId } = await context.params

    const message = await prisma.emailMessage.findFirst({
      where: {
        id: messageId,
        account: {
          tenantId,
        },
      },
      include: {
        attachments: true,
      },
    })

    if (!message) {
      return NextResponse.json({ success: false, error: 'Email message not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: message })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get email message failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch email message' }, { status: 500 })
  }
}
