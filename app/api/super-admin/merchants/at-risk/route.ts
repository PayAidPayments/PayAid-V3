import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireSuperAdmin()
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: { status: 'active' },
      include: {
        users: {
          select: {
            lastLoginAt: true,
          },
        },
        invoices: {
          where: {
            createdAt: { gte: thirtyDaysAgo },
          },
          select: {
            status: true,
            paymentStatus: true,
          },
        },
      },
    })

    const atRiskMerchants = await Promise.all(
      tenants.map(async (tenant) => {
        const riskFactors: string[] = []
        let riskScore = 0

        // Check failed payments
        const failedPayments = tenant.invoices.filter(
          (inv) => inv.status === 'failed' || inv.paymentStatus === 'failed'
        ).length
        if (failedPayments > 0) {
          riskFactors.push(`${failedPayments} failed payments`)
          riskScore += Math.min(failedPayments * 10, 40)
        }

        // Check chargebacks (mock - would come from payment provider)
        const chargebacks = 0 // TODO: Get from payment provider
        if (chargebacks > 0) {
          riskFactors.push(`${chargebacks} chargebacks`)
          riskScore += chargebacks * 20
        }

        // Check KYC issues
        const onboarding = await prisma.merchantOnboarding.findUnique({
          where: { tenantId: tenant.id },
          select: {
            kycStatus: true,
            riskScore: true,
          },
        })
        const kycIssues = onboarding?.kycStatus === 'rejected' || onboarding?.kycStatus === 'needs_info' ? 1 : 0
        if (kycIssues > 0) {
          riskFactors.push('KYC issues')
          riskScore += 15
        }

        // Check last login
        const lastLogin = tenant.users
          .map((u) => u.lastLoginAt)
          .filter(Boolean)
          .sort()
          .reverse()[0]
        const daysSinceLogin = lastLogin
          ? Math.floor((Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24))
          : 999
        if (daysSinceLogin > 30) {
          riskFactors.push('No login in 30+ days')
          riskScore += 25
        }

        // Check new location logins (mock - would come from auth logs)
        const newLocationLogins = 0 // TODO: Get from auth logs
        if (newLocationLogins > 0) {
          riskFactors.push(`${newLocationLogins} new location logins`)
          riskScore += Math.min(newLocationLogins * 5, 20)
        }

        return {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          status: tenant.status,
          riskScore: Math.min(riskScore, 100),
          riskFactors,
          lastLoginAt: lastLogin?.toISOString() || null,
          failedPayments,
          chargebacks,
          kycIssues,
          newLocationLogins,
        }
      })
    )

    // Sort by risk score descending
    const sorted = atRiskMerchants
      .filter((m) => m.riskScore > 0)
      .sort((a, b) => b.riskScore - a.riskScore)

    return NextResponse.json({ data: sorted })
  } catch (e) {
    console.error('At-risk merchants error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
