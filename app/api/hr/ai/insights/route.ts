import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/ai/insights
 * Get AI-driven HR insights including flight risk prediction, engagement trends, etc.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    // Mock AI insights - in production, these would come from ML models
    const insights = {
      flightRisks: [
        {
          name: 'Rajesh Kumar',
          risk: 87,
          reason: 'low engagement',
          department: 'Engineering',
          lastPromotion: '18 months ago',
          engagementScore: 45,
        },
        {
          name: 'Priya Sharma',
          risk: 72,
          reason: 'no promotion in 18 months',
          department: 'Sales',
          lastPromotion: '18 months ago',
          engagementScore: 58,
        },
        {
          name: 'Amit Patel',
          risk: 65,
          reason: 'declining performance',
          department: 'Marketing',
          lastPromotion: '12 months ago',
          engagementScore: 62,
        },
      ],
      engagementTrends: {
        avgEngagement: 82,
        trend: 'up',
        change: 2,
        topDepartments: [
          { name: 'Engineering', score: 88 },
          { name: 'Sales', score: 85 },
          { name: 'HR', score: 82 },
        ],
        bottomDepartments: [
          { name: 'Operations', score: 75 },
          { name: 'Support', score: 78 },
        ],
      },
      hiringInsights: {
        velocity: 14,
        target: 10,
        bottlenecks: ['Interview scheduling', 'Offer approval'],
        recommendations: [
          'Automate interview scheduling to reduce time by 2 days',
          'Pre-approve standard offer templates',
        ],
      },
      overtimeRisk: [
        {
          team: 'Engineering',
          risk: 18,
          avgHours: 48,
          recommendation: 'Consider hiring 2 additional engineers',
        },
        {
          team: 'Sales',
          risk: 12,
          avgHours: 45,
          recommendation: 'Review workload distribution',
        },
      ],
      retentionRecommendations: [
        {
          text: 'Optimize Q2 bonuses by ₹2.4L for 15% retention boost',
          impact: 'High impact',
          cost: 240000,
          expectedRetention: 15,
        },
        {
          text: 'Implement flexible work hours for Engineering team',
          impact: 'Medium impact',
          cost: 0,
          expectedRetention: 8,
        },
      ],
      anomalyDetection: [
        {
          type: 'overtime_fraud',
          description: 'Unusual overtime pattern detected for employee ID 123',
          severity: 'medium',
          action: 'Review attendance records',
        },
      ],
    }

    return NextResponse.json(insights)
  } catch (error: any) {
    console.error('HR AI insights error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to fetch HR AI insights', message: error?.message },
      { status: 500 }
    )
  }
}
