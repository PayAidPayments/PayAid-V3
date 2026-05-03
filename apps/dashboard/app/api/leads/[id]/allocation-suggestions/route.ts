import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getAllocationSuggestions } from '@/lib/sales-automation/lead-allocation'
import { prisma } from '@/lib/db/prisma'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'

function getDisplayFromHrProfile(
  profile:
    | {
        firstName: string
        lastName: string
        officialEmail: string
      }
    | undefined,
  fallback: { name: string | null; email: string }
) {
  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : ''
  return {
    name: fullName || fallback.name || fallback.email,
    email: profile?.officialEmail || fallback.email,
  }
}

/**
 * GET /api/leads/[id]/allocation-suggestions
 * Get top 3 suggested sales reps for a lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

    const contactId = resolvedParams.id
    const suggestions = await getAllocationSuggestions(contactId, tenantId)
    const repUserIds = suggestions.map((s) => s.rep.userId)
    const hrProfiles = repUserIds.length
      ? await prisma.employee.findMany({
          where: {
            tenantId,
            userId: { in: repUserIds },
            status: { in: ['ACTIVE', 'PROBATION'] },
          },
          select: { userId: true, firstName: true, lastName: true, officialEmail: true },
        })
      : []
    const hrProfileByUserId = new Map(
      hrProfiles
        .filter((p) => typeof p.userId === 'string' && p.userId.length > 0)
        .map((p) => [p.userId as string, p])
    )

    return NextResponse.json({
      success: true,
      suggestions: suggestions.map((s) => {
        const repDisplay = getDisplayFromHrProfile(hrProfileByUserId.get(s.rep.userId), {
          name: s.rep.user.name,
          email: s.rep.user.email,
        })
        return {
          rep: {
            id: s.rep.id,
            name: repDisplay.name,
            email: repDisplay.email,
            specialization: s.rep.specialization,
            conversionRate: s.rep.conversionRate,
            assignedLeadsCount: s.rep.assignedLeadsCount || 0,
          },
          score: s.score,
          reasons: s.reasons,
        }
      }),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get allocation suggestions error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get allocation suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
