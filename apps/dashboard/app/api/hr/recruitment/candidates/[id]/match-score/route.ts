import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/recruitment/candidates/[id]/match-score
 * Calculate resume match score for a candidate against job requisition
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const { searchParams } = new URL(request.url)
    const jobRequisitionId = searchParams.get('jobRequisitionId')

    if (!jobRequisitionId) {
      return NextResponse.json(
        { error: 'Job requisition ID is required' },
        { status: 400 }
      )
    }

    // Get candidate (current schema: fullName, skills[], location, etc.)
    const candidate = await prisma.candidate.findFirst({
      where: { id: id, tenantId },
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Get job requisition with location
    const jobRequisition = await prisma.jobRequisition.findFirst({
      where: { id: jobRequisitionId, tenantId },
      include: { location: true },
    })

    if (!jobRequisition) {
      return NextResponse.json({ error: 'Job requisition not found' }, { status: 404 })
    }

    let matchScore = 0
    const factors: Array<{ factor: string; score: number; maxScore: number }> = []

    // Skills vs job title match (40 points) - keyword overlap between candidate skills and job title
    const titleLower = jobRequisition.title.toLowerCase()
    const candidateSkills = (candidate.skills || []).map((s) => s.toLowerCase())
    const titleWords = titleLower.split(/\s+/).filter((w) => w.length > 2)
    const skillsInTitle = candidateSkills.filter((s) =>
      titleWords.some((w) => s.includes(w) || w.includes(s))
    )
    const skillsMatch = titleWords.length > 0
      ? Math.min(40, (skillsInTitle.length / Math.max(titleWords.length, 1)) * 40)
      : candidateSkills.length > 0 ? 20 : 10
    matchScore += skillsMatch
    factors.push({ factor: 'Skills/Title Match', score: Math.round(skillsMatch), maxScore: 40 })

    // Experience proxy (30 points) - from notice period / tenure hint or skills count
    const experienceProxy = candidate.noticePeriodDays != null
      ? Math.min(30, (candidate.noticePeriodDays / 90) * 30)
      : candidateSkills.length >= 5 ? 25 : candidateSkills.length >= 2 ? 15 : 10
    matchScore += experienceProxy
    factors.push({ factor: 'Experience proxy', score: Math.round(experienceProxy), maxScore: 30 })

    // Location match (20 points)
    const jobLoc = jobRequisition.location?.name ?? jobRequisition.location?.city ?? ''
    const candLoc = (candidate.location ?? '').toLowerCase()
    const locMatch = jobLoc && candLoc
      ? (candLoc.includes(jobLoc.toLowerCase()) || jobLoc.toLowerCase().includes(candLoc)) ? 20 : 10
      : 0
    matchScore += locMatch
    factors.push({ factor: 'Location', score: locMatch, maxScore: 20 })

    // Profile completeness (10 points)
    const hasCtc = candidate.expectedCtcInr != null || candidate.currentCtcInr != null
    const completeness = (candidateSkills.length > 0 ? 5 : 0) + (candidate.location ? 3 : 0) + (hasCtc ? 2 : 0)
    matchScore += completeness
    factors.push({ factor: 'Profile completeness', score: completeness, maxScore: 10 })

    matchScore = Math.min(100, Math.round(matchScore))

    let matchLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
    if (matchScore >= 80) matchLevel = 'EXCELLENT'
    else if (matchScore >= 60) matchLevel = 'GOOD'
    else if (matchScore >= 40) matchLevel = 'FAIR'
    else matchLevel = 'POOR'

    // Skill gaps: words in job title not covered by candidate skills
    const skillGaps = titleWords.filter(
      (w) => w.length > 3 && !candidateSkills.some((s) => s.includes(w) || w.includes(s))
    ).slice(0, 5)

    return NextResponse.json({
      candidateId: id,
      jobRequisitionId,
      matchScore,
      matchLevel,
      factors,
      skillGaps,
      calculatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
