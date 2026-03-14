/**
 * Voice Agent Campaigns API
 * GET  /api/v1/voice-agents/campaigns - List campaigns
 * POST /api/v1/voice-agents/campaigns - Create campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  agentId: z.string().min(1),
  campaignType: z.enum(['reminder', 'lead_nurturing', 'survey', 'collections']),
  script: z.string().optional().nullable(),
  autoRemoveDnd: z.boolean().optional().default(true),
  paceCallsPerMin: z.number().int().min(1).max(120).optional().default(10),
})

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const statusFilter = searchParams.get('status') // all | running | paused | completed | draft

    const where: { tenantId: string; status?: string } = { tenantId: user.tenantId }
    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter
    }

    const campaigns = await prisma.voiceAgentCampaign.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true } },
        _count: { select: { contacts: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const campaignIds = campaigns.map((c) => c.id)
    const contactStats =
      campaignIds.length > 0
        ? await prisma.voiceAgentCampaignContact.groupBy({
            by: ['campaignId', 'status'],
            where: { campaignId: { in: campaignIds } },
            _count: true,
          })
        : []

    const statsByCampaign = new Map<string, { completed: number; pending: number; dnd_skipped: number; failed: number; calling: number }>()
    for (const row of contactStats) {
      if (!statsByCampaign.has(row.campaignId)) {
        statsByCampaign.set(row.campaignId, { completed: 0, pending: 0, dnd_skipped: 0, failed: 0, calling: 0 })
      }
      const s = statsByCampaign.get(row.campaignId)!
      const k = row.status as keyof typeof s
      if (k in s) (s as any)[k] = row._count
    }

    const totalContacts = campaigns.reduce((sum, c) => sum + c._count.contacts, 0)
    let totalCompleted = 0
    campaigns.forEach((c) => {
      const s = statsByCampaign.get(c.id)
      if (s) totalCompleted += s.completed
    })

    const campaignsWithStats = campaigns.map(({ _count, ...c }) => {
      const s = statsByCampaign.get(c.id) || { completed: 0, pending: 0, dnd_skipped: 0, failed: 0, calling: 0 }
      const contactCount = _count.contacts
      const callsMade = s.completed + s.failed + s.dnd_skipped
      const conversionRate = contactCount > 0 ? Math.round((s.completed / contactCount) * 100) : 0
      const progressPct = contactCount > 0 ? Math.round((callsMade / contactCount) * 100) : 0
      return {
        ...c,
        contactCount,
        completedCount: s.completed,
        callsMade,
        conversionRate,
        progressPct,
      }
    })

    const activeCount = campaigns.filter((c) => c.status === 'running' || c.status === 'paused').length
    const successPct = totalContacts > 0 ? Math.round((totalCompleted / totalContacts) * 100) : 0
    const overview = {
      activeCampaigns: activeCount,
      totalContacts,
      totalCompleted,
      conversionRate: successPct,
      successPct,
      revenueRupees: 0,
    }

    return NextResponse.json({
      campaigns: campaignsWithStats,
      overview,
    })
  } catch (error) {
    console.error('[Campaigns] GET error:', error)
    return NextResponse.json({ error: 'Failed to list campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createCampaignSchema.parse(body)

    const agent = await prisma.voiceAgent.findFirst({
      where: { id: validated.agentId, tenantId: user.tenantId },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const campaign = await prisma.voiceAgentCampaign.create({
      data: {
        tenantId: user.tenantId,
        agentId: validated.agentId,
        name: validated.name,
        campaignType: validated.campaignType,
        script: validated.script ?? null,
        autoRemoveDnd: validated.autoRemoveDnd,
        paceCallsPerMin: validated.paceCallsPerMin,
        status: 'draft',
      },
      include: { agent: { select: { id: true, name: true } } },
    })

    return NextResponse.json(campaign)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 })
    }
    console.error('[Campaigns] POST error:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
