import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth/jwt'

const SUPER_ADMIN_ROLES = ['SUPER_ADMIN', 'super_admin']

export async function GET() {
  try {
    await requireSuperAdmin()
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // AI Summary data
    const [newMerchants24h, atRiskMerchants, apiErrors, whatsappUsage, recentChanges] = await Promise.all([
      prisma.tenant.count({
        where: { createdAt: { gte: twentyFourHoursAgo } },
      }).catch(() => 0),
      prisma.tenant.count({
        where: {
          status: 'active',
          users: {
            none: {
              lastLoginAt: { gte: thirtyDaysAgo },
            },
          },
        },
      }).catch(() => 0),
      // Mock API errors change (would come from error logs in production)
      Promise.resolve(14),
      // Mock WhatsApp usage change
      Promise.resolve(0),
      // Recent changes (feature flags, plan changes)
      Promise.all([
        prisma.featureToggle.findMany({
          where: { updatedAt: { gte: twentyFourHoursAgo } },
          take: 5,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            featureName: true,
            isEnabled: true,
            updatedAt: true,
          },
        }).catch(() => []),
        prisma.subscription.findMany({
          where: { updatedAt: { gte: twentyFourHoursAgo } },
          take: 5,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            tenantId: true,
            plan: true,
            updatedAt: true,
            tenant: {
              select: { name: true },
            },
          },
        }).catch(() => []),
      ]).then(([flags, subscriptions]) => {
        const changes = [
          ...flags.map((f) => ({
            type: 'feature_flag' as const,
            title: `Feature flag "${f.featureName}" ${f.isEnabled ? 'enabled' : 'disabled'}`,
            description: `Flag toggled`,
            timestamp: f.updatedAt.toISOString(),
            href: `/super-admin/configuration/feature-flags`,
          })),
          ...subscriptions.map((s) => ({
            type: 'plan_change' as const,
            title: `${s.tenant?.name || 'Tenant'} plan changed`,
            description: `Plan: ${s.plan}`,
            timestamp: s.updatedAt.toISOString(),
            href: `/super-admin/revenue/plans`,
          })),
        ]
        return changes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)
      }),
    ])

    // Top 5 error types (mock - would come from error logs)
    const topErrors = [
      { type: 'Database Connection Timeout', count: 45, percentage: 32 },
      { type: 'API Rate Limit Exceeded', count: 28, percentage: 20 },
      { type: 'Invalid Payment Method', count: 22, percentage: 16 },
      { type: 'Authentication Failed', count: 18, percentage: 13 },
      { type: 'Webhook Delivery Failed', count: 12, percentage: 9 },
    ]

    // Onboarding funnel data
    const onboardingFunnel = await Promise.all([
      prisma.merchantOnboarding.count().catch(() => 0),
      prisma.merchantOnboarding.count({
        where: { kycStatus: { not: 'not_started' } },
      }).catch(() => 0),
      prisma.merchantOnboarding.count({
        where: { status: 'approved' },
      }).catch(() => 0),
      prisma.invoice.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: 'paid',
        },
        distinct: ['tenantId'],
      }).catch(() => 0),
    ]).then(([applications, kycStarted, approved, firstPayment]) => [
      {
        step: 'Applications',
        applications,
        kycStarted: 0,
        approved: 0,
        firstPayment: 0,
      },
      {
        step: 'KYC Started',
        applications: 0,
        kycStarted,
        approved: 0,
        firstPayment: 0,
      },
      {
        step: 'Approved',
        applications: 0,
        kycStarted: 0,
        approved,
        firstPayment: 0,
      },
      {
        step: 'First Payment',
        applications: 0,
        kycStarted: 0,
        approved: 0,
        firstPayment,
      },
    ])

    return NextResponse.json({
      aiSummary: {
        newMerchants: newMerchants24h,
        atRiskMerchants,
        apiErrorsChange: apiErrors,
        whatsappUsageChange: whatsappUsage,
        revenueChange: 0,
      },
      topErrors,
      recentChanges,
      onboardingFunnel,
    })
  } catch (e) {
    console.error('Enhanced overview error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
