import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { calculateCustomerHealthScore } from '@/lib/ai/customer-health-scoring'

/**
 * GET /api/crm/analytics/health-scores
 * Get health scores for all customers (with filtering)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const riskLevel = searchParams.get('riskLevel') as 'low' | 'medium' | 'high' | 'critical' | null
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Get all contacts
    const contacts = await prisma.contact.findMany({
      where: { tenantId },
      take: limit,
      select: { id: true, name: true, email: true },
    })

    // Calculate health scores
    const healthScores = await Promise.all(
      contacts.map(async (contact) => {
        try {
          const score = await calculateCustomerHealthScore(contact.id, tenantId)
          return {
            contactId: contact.id,
            contactName: contact.name,
            contactEmail: contact.email,
            ...score,
          }
        } catch (error) {
          console.error(`Error calculating health score for contact ${contact.id}:`, error)
          return null
        }
      })
    )

    // Filter by risk level if specified
    const filtered = riskLevel
      ? healthScores.filter((s) => s && s.riskLevel === riskLevel)
      : healthScores.filter((s) => s !== null)

    // Sort by risk percentage (highest first)
    filtered.sort((a, b) => {
      if (!a || !b) return 0
      return b.riskPercentage - a.riskPercentage
    })

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
