import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@payaid/db'
import { calculateCustomerHealthScoresBatch } from '@/lib/ai/customer-health-scoring'

/**
 * GET /api/crm/analytics/health-scores
 * Get health scores for all customers (with filtering). Uses batch in:ids + groupBy to avoid N+1.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const riskLevel = searchParams.get('riskLevel') as 'low' | 'medium' | 'high' | 'critical' | null
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const contactIds = await prisma.contact.findMany({
      where: { tenantId },
      take: limit,
      select: { id: true },
    }).then((rows) => rows.map((r) => r.id))

    const healthScores = await calculateCustomerHealthScoresBatch(contactIds, tenantId)

    // Filter by risk level if specified
    const filtered = riskLevel
      ? healthScores.filter((s) => s.riskLevel === riskLevel)
      : healthScores

    // Sort by risk percentage (highest first)
    filtered.sort((a, b) => b.riskPercentage - a.riskPercentage)

    return NextResponse.json({
      success: true,
      data: filtered,
      count: filtered.length,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error fetching health scores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health scores' },
      { status: 500 }
    )
  }
}
