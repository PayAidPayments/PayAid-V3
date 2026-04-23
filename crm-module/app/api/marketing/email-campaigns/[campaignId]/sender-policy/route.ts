import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

type RouteContext = {
  params: Promise<{ campaignId: string }>
}

const updateSenderPolicySchema = z.object({
  senderAccountId: z.string().nullable().optional(),
  senderDomain: z.string().nullable().optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const { campaignId } = await context.params

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId,
        type: 'email',
      },
      select: {
        id: true,
      },
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    const [policy, senderAccounts] = await Promise.all([
      prisma.emailCampaignSenderPolicy.findUnique({
        where: { campaignId },
        select: {
          senderAccountId: true,
          senderDomain: true,
          updatedAt: true,
        },
      }),
      prisma.emailAccount.findMany({
        where: {
          tenantId,
          isActive: true,
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          email: true,
          displayName: true,
          provider: true,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        policy: {
          senderAccountId: policy?.senderAccountId || null,
          senderDomain: policy?.senderDomain || null,
          updatedAt: policy?.updatedAt || null,
        },
        senderAccounts,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get sender policy failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to load sender policy' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'marketing')
    const { campaignId } = await context.params
    const body = await request.json().catch(() => ({}))
    const input = updateSenderPolicySchema.parse(body)

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId,
        type: 'email',
      },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    if (input.senderAccountId) {
      const account = await prisma.emailAccount.findFirst({
        where: {
          id: input.senderAccountId,
          tenantId,
          isActive: true,
        },
        select: { id: true },
      })
      if (!account) {
        return NextResponse.json({ success: false, error: 'Invalid sender account' }, { status: 400 })
      }
    }

    const senderDomain = (input.senderDomain || '').trim().toLowerCase() || null
    const senderAccountId = input.senderAccountId || null

    if (!senderAccountId && !senderDomain) {
      await prisma.emailCampaignSenderPolicy.deleteMany({
        where: {
          campaignId,
          tenantId,
        },
      })
      await writeIntegrationAudit({
        tenantId,
        userId,
        entityType: 'email_campaign',
        entityId: campaignId,
        action: 'email_campaign_sender_policy_cleared',
        after: {
          senderAccountId: null,
          senderDomain: null,
        },
      })
      return NextResponse.json({
        success: true,
        data: {
          senderAccountId: null,
          senderDomain: null,
        },
      })
    }

    const policy = await prisma.emailCampaignSenderPolicy.upsert({
      where: { campaignId },
      create: {
        tenantId,
        campaignId,
        senderAccountId,
        senderDomain,
      },
      update: {
        senderAccountId,
        senderDomain,
      },
      select: {
        senderAccountId: true,
        senderDomain: true,
        updatedAt: true,
      },
    })

    await writeIntegrationAudit({
      tenantId,
      userId,
      entityType: 'email_campaign',
      entityId: campaignId,
      action: 'email_campaign_sender_policy_updated',
      after: {
        senderAccountId: policy.senderAccountId || null,
        senderDomain: policy.senderDomain || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: policy,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Update sender policy failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to update sender policy' }, { status: 500 })
  }
}
