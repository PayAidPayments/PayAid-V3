import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireSuperAdmin()

    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Calculate completion rate
    const totalOnboarding = await prisma.merchantOnboarding.count()
    const approvedOnboarding = await prisma.merchantOnboarding.count({
      where: { status: 'approved' },
    })
    const completionRate = totalOnboarding > 0 ? (approvedOnboarding / totalOnboarding) * 100 : 0

    // Calculate average time to approval
    const approvedRecords = await prisma.merchantOnboarding.findMany({
      where: {
        status: 'approved',
        reviewedAt: { not: null },
      },
      select: {
        createdAt: true,
        reviewedAt: true,
      },
    })

    const avgTimeToApproval =
      approvedRecords.length > 0
        ? approvedRecords.reduce((sum, record) => {
            const days =
              (record.reviewedAt!.getTime() - record.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            return sum + days
          }, 0) / approvedRecords.length
        : 0

    // Calculate drop-off rate
    const pendingRecords = await prisma.merchantOnboarding.count({
      where: {
        status: { in: ['pending_review', 'needs_info'] },
        createdAt: { lt: thirtyDaysAgo },
      },
    })
    const dropOffRate = totalOnboarding > 0 ? (pendingRecords / totalOnboarding) * 100 : 0

    // Status distribution
    const statusDistribution = {
      approved: await prisma.merchantOnboarding.count({ where: { status: 'approved' } }),
      pending: await prisma.merchantOnboarding.count({ where: { status: 'pending_review' } }),
      rejected: await prisma.merchantOnboarding.count({ where: { status: 'rejected' } }),
      needsInfo: await prisma.merchantOnboarding.count({ where: { status: 'needs_info' } }),
    }

    // Completion rate over time (last 6 months)
    const completionRateData = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const monthTotal = await prisma.merchantOnboarding.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      })

      const monthApproved = await prisma.merchantOnboarding.count({
        where: {
          status: 'approved',
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      })

      completionRateData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        rate: monthTotal > 0 ? Math.round((monthApproved / monthTotal) * 100) : 0,
      })
    }

    // Drop-off analysis (funnel)
    const dropOffData = [
      {
        step: 'Signup',
        count: await prisma.tenant.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),
      },
      {
        step: 'Business Info',
        count: await prisma.merchantOnboarding.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),
      },
      {
        step: 'KYC Upload',
        count: (
          await prisma.kYCDocument.groupBy({
            where: { createdAt: { gte: thirtyDaysAgo } },
            by: ['tenantId'],
          })
        ).length,
      },
      {
        step: 'Document Review',
        count: (
          await prisma.kYCDocument.groupBy({
            where: {
              createdAt: { gte: thirtyDaysAgo },
              verificationStatus: { not: 'pending' },
            },
            by: ['tenantId'],
          })
        ).length,
      },
      {
        step: 'Approved',
        count: await prisma.merchantOnboarding.count({
          where: {
            status: 'approved',
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
      },
    ]

    // Time to approval distribution
    const timeToApprovalData = [
      {
        period: '0-24h',
        count: approvedRecords.filter((r) => {
          const hours = (r.reviewedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60)
          return hours <= 24
        }).length,
      },
      {
        period: '1-3 days',
        count: approvedRecords.filter((r) => {
          const days = (r.reviewedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          return days > 1 && days <= 3
        }).length,
      },
      {
        period: '3-7 days',
        count: approvedRecords.filter((r) => {
          const days = (r.reviewedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          return days > 3 && days <= 7
        }).length,
      },
      {
        period: '7+ days',
        count: approvedRecords.filter((r) => {
          const days = (r.reviewedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          return days > 7
        }).length,
      },
    ]

    return NextResponse.json({
      data: {
        completionRate: Math.round(completionRate),
        avgTimeToApproval: Math.round(avgTimeToApproval * 10) / 10,
        dropOffRate: Math.round(dropOffRate),
        pendingReviews: await prisma.merchantOnboarding.count({
          where: { status: 'pending_review' },
        }),
        statusDistribution,
        completionRateData,
        dropOffData,
        timeToApprovalData,
      },
    })
  } catch (e) {
    console.error('Super admin onboarding analytics error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
