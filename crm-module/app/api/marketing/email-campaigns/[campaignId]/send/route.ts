import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { addEmailCampaignDispatchJob } from '@/lib/queue/email-queue'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

type RouteContext = {
  params: Promise<{ campaignId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const { campaignId } = await context.params

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId,
        type: 'email',
      },
      select: { id: true, status: true },
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'scheduled' },
    })

    await addEmailCampaignDispatchJob({
      campaignId,
      tenantId,
      batchSize: 100,
    })

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        queued: true,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Queue campaign send failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to queue campaign send' }, { status: 500 })
  }
}
