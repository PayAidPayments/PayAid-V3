import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireSuperAdmin()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }

  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { monthlyPrice: 'asc' },
    })

    const data = plans.map((p) => ({
      ...p,
      monthlyPrice: Number(p.monthlyPrice),
      annualPrice: p.annualPrice ? Number(p.annualPrice) : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))

    return NextResponse.json({ data })
  } catch (e) {
    console.error('Get plans error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }

  try {
    const body = await request.json()
    const { name, description, tier, monthlyPrice, annualPrice, modules, maxUsers, maxStorage, features } = body

    const plan = await prisma.subscriptionPlan.create({
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
        isActive: true,
        isSystem: false,
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
    console.error('Create plan error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
