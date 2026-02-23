import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/insurance/plans/[id]
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id } = await context.params

    const plan = await prisma.insurancePlan.findFirst({
      where: { id, tenantId },
    })
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    return NextResponse.json(plan)
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

/**
 * PATCH /api/hr/insurance/plans/[id]
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id } = await context.params

    const existing = await prisma.insurancePlan.findFirst({
      where: { id, tenantId },
    })
    if (!existing) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    const body = await request.json()
    const { planName, planType, provider, coverageAmount, premiumAmount, startDate, endDate, description, status } = body

    const plan = await prisma.insurancePlan.update({
      where: { id },
      data: {
        ...(planName != null && { planName }),
        ...(planType != null && { planType }),
        ...(provider != null && { provider }),
        ...(coverageAmount != null && { coverageAmount }),
        ...(premiumAmount != null && { premiumAmount }),
        ...(startDate != null && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(description !== undefined && { description }),
        ...(status != null && { status }),
      },
    })
    return NextResponse.json(plan)
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
