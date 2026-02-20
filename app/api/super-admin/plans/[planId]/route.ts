import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    await requireSuperAdmin()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }

  try {
    const { planId } = await params
    const body = await request.json()
    const { name, description, tier, monthlyPrice, annualPrice, modules, maxUsers, maxStorage, features, isActive } = body

    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        name,
        description,
        tier,
        monthlyPrice,
        annualPrice,
        modules: modules || [],
        maxUsers,
        maxStorage,
        features: features || {},
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        monthlyPrice: Number(plan.monthlyPrice),
        annualPrice: plan.annualPrice ? Number(plan.annualPrice) : null,
      },
    })
  } catch (e) {
    console.error('Update plan error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    await requireSuperAdmin()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }

  try {
    const { planId } = await params

    await prisma.subscriptionPlan.delete({
      where: { id: planId },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete plan error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
