import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireSuperAdmin()

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        merchantOnboarding: {
          select: { riskScore: true, status: true, kycStatus: true },
        },
      },
    })

    const data = tenants.map((t) => {
      const onboarding = t.merchantOnboarding
      const riskScore = onboarding?.riskScore ?? 50
      let riskTier: string = 'medium'
      if (riskScore <= 25) riskTier = 'low'
      else if (riskScore <= 50) riskTier = 'medium'
      else if (riskScore <= 75) riskTier = 'high'
      else riskTier = 'blocked'
      if (t.status === 'suspended') riskTier = 'blocked'
      return {
        tenantId: t.id,
        tenantName: t.name,
        riskScore: Math.round(riskScore),
        riskTier,
        factors: {
          kyc: onboarding?.kycStatus === 'verified' ? -10 : 10,
          onboarding: onboarding?.status === 'approved' ? -15 : 5,
        },
      }
    })

    return NextResponse.json({ data })
  } catch (e) {
    console.error('Super admin risk-assessment error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
