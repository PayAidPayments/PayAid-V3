import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { mediumPriorityQueue } from '@/lib/queue/bull'

// POST /api/marketing/campaigns/[id]/send - Send a draft campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    // Check marketing module license
    const { tenantId } = await requireModuleAccess(request, 'marketing')

    // Get campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Only allow sending draft campaigns
    if (campaign.status !== 'draft') {
      return NextResponse.json(
        { error: `Campaign cannot be sent. Current status: ${campaign.status}` },
        { status: 400 }
      )
    }

    // Update campaign status to scheduled (will be sent immediately)
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'scheduled' },
    })

    // Queue campaign sending
    await mediumPriorityQueue.add('send-marketing-campaign', {
      campaignId: campaign.id,
      tenantId: tenantId,
      campaignName: campaign.name,
      type: campaign.type,
      subject: campaign.subject,
      content: campaign.content,
      contactIds: campaign.contactIds,
      scheduledFor: null, // Send immediately
    })

    return NextResponse.json({
      success: true,
      message: 'Campaign queued for sending',
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: 'scheduled',
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    console.error('Send campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    )
  }
}

