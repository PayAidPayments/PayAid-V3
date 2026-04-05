import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

/** GET /api/crm/leads/scoreboard - lead score distribution and top leads */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 20), 1), 100)

    const leads = await prisma.contact.findMany({
      where: { tenantId, stage: 'prospect' },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        leadScore: true,
        scoreUpdatedAt: true,
      },
      orderBy: [{ leadScore: 'desc' }, { scoreUpdatedAt: 'desc' }],
      take: limit,
    })

    let cold = 0
    let warm = 0
    let hot = 0
    for (const lead of leads) {
      const s = Math.round(lead.leadScore ?? 0)
      if (s >= 70) hot++
      else if (s >= 40) warm++
      else cold++
    }

    return NextResponse.json({
      success: true,
      summary: { total: leads.length, cold, warm, hot },
      leads: leads.map((lead) => {
        const score = Math.round(lead.leadScore ?? 0)
        return {
          ...lead,
          finalScore: score,
          scoreBand: score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold',
        }
      }),
    })
  } catch (error: any) {
    console.error('Lead scoreboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead scoreboard', message: error.message },
      { status: 500 }
    )
  }
}
