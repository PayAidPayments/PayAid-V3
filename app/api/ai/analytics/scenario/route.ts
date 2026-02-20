/**
 * Scenario Planning API
 * "What if" analysis for business decisions
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/** POST /api/ai/analytics/scenario - Run scenario planning analysis */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { scenario, parameters } = body

    if (!scenario) {
      return NextResponse.json(
        { error: 'scenario description is required' },
        { status: 400 }
      )
    }

    // Get current baseline data
    const currentRevenue = await prisma.invoice.aggregate({
      where: {
        tenantId,
        status: 'sent',
      },
      _sum: {
        total: true,
      },
    })

    const currentDeals = await prisma.deal.findMany({
      where: { tenantId },
      select: { value: true, probability: true },
    })

    const baselineRevenue = Number(currentRevenue._sum.total || 0)
    const pipelineValue = currentDeals.reduce(
      (sum, deal) => sum + Number(deal.value || 0) * (Number(deal.probability || 0) / 100),
      0
    )

    // Parse scenario
    const scen = scenario.toLowerCase()
    let projectedRevenue = baselineRevenue
    let projectedPipeline = pipelineValue
    let assumptions: string[] = []
    let impact: string[] = []

    if (scen.includes('increase') && scen.includes('price') || scen.includes('rate')) {
      const increasePercent = parameters?.increasePercent || 10
      projectedRevenue = baselineRevenue * (1 + increasePercent / 100)
      assumptions.push(`Price increase of ${increasePercent}%`)
      impact.push(`Revenue would increase by ₹${(projectedRevenue - baselineRevenue).toLocaleString('en-IN')}`)
    }

    if (scen.includes('close') && scen.includes('deal')) {
      const closePercent = parameters?.closePercent || 20
      const additionalValue = pipelineValue * (closePercent / 100)
      projectedRevenue = baselineRevenue + additionalValue
      assumptions.push(`${closePercent}% of pipeline closes`)
      impact.push(`Additional revenue: ₹${additionalValue.toLocaleString('en-IN')}`)
    }

    if (scen.includes('customer') && (scen.includes('increase') || scen.includes('more'))) {
      const customerIncrease = parameters?.customerIncrease || 10
      const avgOrderValue = baselineRevenue / Math.max(await prisma.contact.count({ where: { tenantId, type: 'customer' } }), 1)
      const additionalRevenue = avgOrderValue * customerIncrease
      projectedRevenue = baselineRevenue + additionalRevenue
      assumptions.push(`${customerIncrease} more customers`)
      impact.push(`Additional revenue: ₹${additionalRevenue.toLocaleString('en-IN')}`)
    }

    return NextResponse.json({
      scenario,
      baseline: {
        revenue: baselineRevenue,
        pipeline: pipelineValue,
      },
      projected: {
        revenue: projectedRevenue,
        pipeline: projectedPipeline,
      },
      assumptions,
      impact,
      change: {
        revenue: projectedRevenue - baselineRevenue,
        revenuePercent: ((projectedRevenue - baselineRevenue) / baselineRevenue) * 100,
      },
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to run scenario' },
      { status: 500 }
    )
  }
}
